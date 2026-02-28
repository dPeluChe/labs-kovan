import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireFamilyAccessFromSession, requireUserFromSessionToken } from "./lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getEventWithAccessOrThrow(ctx: any, sessionToken: string, eventId: any) {
  const event = await ctx.db.get(eventId);
  if (!event) throw new Error("Evento no encontrado");
  await requireFamilyAccessFromSession(ctx, sessionToken, event.familyId);
  return event;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getRecipientWithAccessOrThrow(ctx: any, sessionToken: string, recipientId: any) {
  const recipient = await ctx.db.get(recipientId);
  if (!recipient) throw new Error("Destinatario no encontrado");
  const event = await getEventWithAccessOrThrow(ctx, sessionToken, recipient.giftEventId);
  return { recipient, event };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getItemWithAccessOrThrow(ctx: any, sessionToken: string, itemId: any) {
  const item = await ctx.db.get(itemId);
  if (!item) throw new Error("Regalo no encontrado");
  const event = await getEventWithAccessOrThrow(ctx, sessionToken, item.giftEventId);
  return { item, event };
}

// ==================== GIFT EVENTS ====================
export const getGiftEvents = query({
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);

    const events = await ctx.db
      .query("giftEvents")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();

    return events.sort((a, b) => {
      // Sort by date ascending (soonest first)
      if (a.date && b.date) {
        return a.date - b.date;
      }
      // If one has date and other doesn't, put dated ones first? Or last?
      // Usually upcoming events first. Undated events at the bottom.
      if (a.date && !b.date) return -1;
      if (!a.date && b.date) return 1;

      // If neither has date, sort by creation time (implicitly by ID or name?)
      // Let's fallback to name for stability
      return a.name.localeCompare(b.name);
    });
  },
});

export const getGiftEvent = query({
  args: { sessionToken: v.string(), eventId: v.id("giftEvents") },
  handler: async (ctx, args) => {
    return await getEventWithAccessOrThrow(ctx, args.sessionToken, args.eventId);
  },
});

export const createGiftEvent = mutation({
  args: {
    sessionToken: v.string(),
    familyId: v.id("families"),
    name: v.string(),
    date: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserFromSessionToken(ctx, args.sessionToken);
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const { sessionToken: _sessionToken, ...payload } = args;
    return await ctx.db.insert("giftEvents", { ...payload, createdBy: user._id });
  },
});

export const updateGiftEvent = mutation({
  args: {
    sessionToken: v.string(),
    eventId: v.id("giftEvents"),
    name: v.optional(v.string()),
    date: v.optional(v.number()),
    description: v.optional(v.string()),
    isCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await getEventWithAccessOrThrow(ctx, args.sessionToken, args.eventId);
    const { eventId, sessionToken: _sessionToken, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(eventId, filteredUpdates);
    return eventId;
  },
});

export const deleteGiftEvent = mutation({
  args: { sessionToken: v.string(), eventId: v.id("giftEvents") },
  handler: async (ctx, args) => {
    await getEventWithAccessOrThrow(ctx, args.sessionToken, args.eventId);
    // Delete all items for all recipients
    const recipients = await ctx.db
      .query("giftRecipients")
      .withIndex("by_event", (q) => q.eq("giftEventId", args.eventId))
      .collect();

    for (const recipient of recipients) {
      const items = await ctx.db
        .query("giftItems")
        .withIndex("by_recipient", (q) => q.eq("giftRecipientId", recipient._id))
        .collect();
      for (const item of items) {
        await ctx.db.delete(item._id);
      }
      await ctx.db.delete(recipient._id);
    }

    await ctx.db.delete(args.eventId);
  },
});

// ==================== GIFT RECIPIENTS ====================
export const getGiftRecipients = query({
  args: { sessionToken: v.string(), eventId: v.id("giftEvents") },
  handler: async (ctx, args) => {
    await getEventWithAccessOrThrow(ctx, args.sessionToken, args.eventId);
    return await ctx.db
      .query("giftRecipients")
      .withIndex("by_event", (q) => q.eq("giftEventId", args.eventId))
      .collect();
  },
});

export const createGiftRecipient = mutation({
  args: {
    sessionToken: v.string(),
    giftEventId: v.id("giftEvents"),
    name: v.string(),
    relatedPersonId: v.optional(v.id("personProfiles")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getEventWithAccessOrThrow(ctx, args.sessionToken, args.giftEventId);
    const { sessionToken: _sessionToken, ...payload } = args;
    return await ctx.db.insert("giftRecipients", payload);
  },
});

export const updateGiftRecipient = mutation({
  args: {
    sessionToken: v.string(),
    recipientId: v.id("giftRecipients"),
    name: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getRecipientWithAccessOrThrow(ctx, args.sessionToken, args.recipientId);
    const { recipientId, sessionToken: _sessionToken, ...updates } = args;
    await ctx.db.patch(recipientId, updates);
    return recipientId;
  },
});

export const deleteGiftRecipient = mutation({
  args: { sessionToken: v.string(), recipientId: v.id("giftRecipients") },
  handler: async (ctx, args) => {
    await getRecipientWithAccessOrThrow(ctx, args.sessionToken, args.recipientId);
    // Delete all items
    const items = await ctx.db
      .query("giftItems")
      .withIndex("by_recipient", (q) => q.eq("giftRecipientId", args.recipientId))
      .collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
    await ctx.db.delete(args.recipientId);
  },
});

// ==================== GIFT ITEMS ====================
export const getGiftItems = query({
  args: { sessionToken: v.string(), recipientId: v.id("giftRecipients") },
  handler: async (ctx, args) => {
    await getRecipientWithAccessOrThrow(ctx, args.sessionToken, args.recipientId);
    return await ctx.db
      .query("giftItems")
      .withIndex("by_recipient", (q) => q.eq("giftRecipientId", args.recipientId))
      .collect();
  },
});

export const getAllGiftItemsForEvent = query({
  args: { sessionToken: v.string(), eventId: v.id("giftEvents") },
  handler: async (ctx, args) => {
    await getEventWithAccessOrThrow(ctx, args.sessionToken, args.eventId);
    const recipients = await ctx.db
      .query("giftRecipients")
      .withIndex("by_event", (q) => q.eq("giftEventId", args.eventId))
      .collect();

    const itemsByRecipient = await Promise.all(
      recipients.map(async (recipient) => {
        const items = await ctx.db
          .query("giftItems")
          .withIndex("by_recipient", (q) => q.eq("giftRecipientId", recipient._id))
          .collect();
        return { recipient, items };
      })
    );

    return itemsByRecipient;
  },
});

// Get unassigned gifts for an event (gifts in the pool)
export const getUnassignedGifts = query({
  args: { sessionToken: v.string(), eventId: v.id("giftEvents") },
  handler: async (ctx, args) => {
    await getEventWithAccessOrThrow(ctx, args.sessionToken, args.eventId);
    const allItems = await ctx.db
      .query("giftItems")
      .withIndex("by_event", (q) => q.eq("giftEventId", args.eventId))
      .collect();

    // Filter to only unassigned items (no recipientId)
    return allItems.filter(item => !item.giftRecipientId);
  },
});

export const createGiftItem = mutation({
  args: {
    sessionToken: v.string(),
    giftEventId: v.id("giftEvents"),
    giftRecipientId: v.optional(v.id("giftRecipients")), // Optional - null means unassigned
    title: v.string(),
    url: v.optional(v.string()),
    priceEstimate: v.optional(v.number()),
    currency: v.optional(v.string()),
    status: v.union(
      v.literal("idea"),
      v.literal("to_buy"),
      v.literal("bought"),
      v.literal("wrapped"),
      v.literal("delivered")
    ),
    assignedTo: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const event = await getEventWithAccessOrThrow(ctx, args.sessionToken, args.giftEventId);
    if (args.giftRecipientId) {
      const recipient = await ctx.db.get(args.giftRecipientId);
      if (!recipient || recipient.giftEventId !== event._id) {
        throw new Error("Destinatario inválido para el evento");
      }
    }
    const { sessionToken: _sessionToken, ...payload } = args;
    return await ctx.db.insert("giftItems", payload);
  },
});

// Assign an unassigned gift to a recipient
export const assignGiftItem = mutation({
  args: {
    sessionToken: v.string(),
    itemId: v.id("giftItems"),
    giftRecipientId: v.id("giftRecipients"),
  },
  handler: async (ctx, args) => {
    const { item } = await getItemWithAccessOrThrow(ctx, args.sessionToken, args.itemId);
    const { recipient } = await getRecipientWithAccessOrThrow(ctx, args.sessionToken, args.giftRecipientId);
    if (item.giftEventId !== recipient.giftEventId) {
      throw new Error("El destinatario no pertenece al mismo evento");
    }
    await ctx.db.patch(args.itemId, { giftRecipientId: args.giftRecipientId });
    return args.itemId;
  },
});

// Unassign a gift (move back to pool)
export const unassignGiftItem = mutation({
  args: {
    sessionToken: v.string(),
    itemId: v.id("giftItems"),
  },
  handler: async (ctx, args) => {
    await getItemWithAccessOrThrow(ctx, args.sessionToken, args.itemId);
    await ctx.db.patch(args.itemId, { giftRecipientId: undefined });
    return args.itemId;
  },
});

export const updateGiftItem = mutation({
  args: {
    sessionToken: v.string(),
    itemId: v.id("giftItems"),
    title: v.optional(v.string()),
    url: v.optional(v.string()),
    priceEstimate: v.optional(v.number()),
    currency: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("idea"),
        v.literal("to_buy"),
        v.literal("bought"),
        v.literal("wrapped"),
        v.literal("delivered")
      )
    ),
    assignedTo: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserFromSessionToken(ctx, args.sessionToken);
    const { itemId, sessionToken: _sessionToken, ...updates } = args;

    // Get current item to check status change
    const { item: currentItem, event } = await getItemWithAccessOrThrow(ctx, args.sessionToken, itemId);

    // Update the item
    await ctx.db.patch(itemId, updates);

    // If status changed to "bought" and has price, create expense
    if (
      args.status === "bought" &&
      currentItem.status !== "bought" &&
      currentItem.priceEstimate
    ) {
      // Check if expense already exists for this item
      const existingExpense = await ctx.db
        .query("expenses")
        .filter((q) => q.eq(q.field("giftItemId"), itemId))
        .first();

      if (!existingExpense) {
        await ctx.db.insert("expenses", {
          familyId: event.familyId,
          type: "gift",
          category: "gifts",
          description: `Regalo: ${currentItem.title}`,
          amount: currentItem.priceEstimate,
          date: Date.now(),
          paidBy: user._id,
          giftItemId: itemId,
          giftEventId: currentItem.giftEventId,
        });
      }
    }

    return itemId;
  },
});

export const deleteGiftItem = mutation({
  args: { sessionToken: v.string(), itemId: v.id("giftItems") },
  handler: async (ctx, args) => {
    await getItemWithAccessOrThrow(ctx, args.sessionToken, args.itemId);
    await ctx.db.delete(args.itemId);
  },
});

// ==================== SUMMARY QUERIES ====================
export const getGiftEventSummary = query({
  args: { sessionToken: v.string(), eventId: v.id("giftEvents") },
  handler: async (ctx, args) => {
    await getEventWithAccessOrThrow(ctx, args.sessionToken, args.eventId);
    const recipients = await ctx.db
      .query("giftRecipients")
      .withIndex("by_event", (q) => q.eq("giftEventId", args.eventId))
      .collect();

    let totalItems = 0;
    const byStatus: Record<string, number> = {
      idea: 0,
      to_buy: 0,
      bought: 0,
      wrapped: 0,
      delivered: 0,
    };
    let totalEstimate = 0;

    for (const recipient of recipients) {
      const items = await ctx.db
        .query("giftItems")
        .withIndex("by_recipient", (q) => q.eq("giftRecipientId", recipient._id))
        .collect();

      totalItems += items.length;
      for (const item of items) {
        byStatus[item.status]++;
        if (item.priceEstimate) {
          totalEstimate += item.priceEstimate;
        }
      }
    }

    return {
      recipientCount: recipients.length,
      totalItems,
      byStatus,
      totalEstimate,
    };
  },
});

// Get recipients with their gift status breakdown
export const getRecipientsWithStatus = query({
  args: { sessionToken: v.string(), eventId: v.id("giftEvents") },
  handler: async (ctx, args) => {
    await getEventWithAccessOrThrow(ctx, args.sessionToken, args.eventId);
    const recipients = await ctx.db
      .query("giftRecipients")
      .withIndex("by_event", (q) => q.eq("giftEventId", args.eventId))
      .collect();

    const result = [];

    for (const recipient of recipients) {
      const items = await ctx.db
        .query("giftItems")
        .withIndex("by_recipient", (q) => q.eq("giftRecipientId", recipient._id))
        .collect();

      const pending = items.filter((i) => i.status === "idea" || i.status === "to_buy").length;
      const bought = items.filter((i) => i.status === "bought" || i.status === "wrapped" || i.status === "delivered").length;

      result.push({
        ...recipient,
        totalItems: items.length,
        pending,
        bought,
        allBought: items.length > 0 && pending === 0,
        hasNoGifts: items.length === 0,
      });
    }

    return result;
  },
});
