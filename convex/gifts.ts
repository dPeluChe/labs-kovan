import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
// Security helper - disabled for demo mode
// import { getFamilyUser } from "./lib/utils";

// ==================== GIFT EVENTS ====================
export const getGiftEvents = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    // TODO: Enable security when auth is fully implemented
    // await getFamilyUser(ctx, { familyId: args.familyId });

    return await ctx.db
      .query("giftEvents")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();
  },
});

export const getGiftEvent = query({
  args: { eventId: v.id("giftEvents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.eventId);
  },
});

export const createGiftEvent = mutation({
  args: {
    familyId: v.id("families"),
    name: v.string(),
    date: v.optional(v.number()),
    description: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("giftEvents", args);
  },
});

export const updateGiftEvent = mutation({
  args: {
    eventId: v.id("giftEvents"),
    name: v.optional(v.string()),
    date: v.optional(v.number()),
    description: v.optional(v.string()),
    isCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { eventId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(eventId, filteredUpdates);
    return eventId;
  },
});

export const deleteGiftEvent = mutation({
  args: { eventId: v.id("giftEvents") },
  handler: async (ctx, args) => {
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
  args: { eventId: v.id("giftEvents") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("giftRecipients")
      .withIndex("by_event", (q) => q.eq("giftEventId", args.eventId))
      .collect();
  },
});

export const createGiftRecipient = mutation({
  args: {
    giftEventId: v.id("giftEvents"),
    name: v.string(),
    relatedPersonId: v.optional(v.id("personProfiles")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("giftRecipients", args);
  },
});

export const updateGiftRecipient = mutation({
  args: {
    recipientId: v.id("giftRecipients"),
    name: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { recipientId, ...updates } = args;
    await ctx.db.patch(recipientId, updates);
    return recipientId;
  },
});

export const deleteGiftRecipient = mutation({
  args: { recipientId: v.id("giftRecipients") },
  handler: async (ctx, args) => {
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
  args: { recipientId: v.id("giftRecipients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("giftItems")
      .withIndex("by_recipient", (q) => q.eq("giftRecipientId", args.recipientId))
      .collect();
  },
});

export const getAllGiftItemsForEvent = query({
  args: { eventId: v.id("giftEvents") },
  handler: async (ctx, args) => {
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
  args: { eventId: v.id("giftEvents") },
  handler: async (ctx, args) => {
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
    return await ctx.db.insert("giftItems", args);
  },
});

// Assign an unassigned gift to a recipient
export const assignGiftItem = mutation({
  args: {
    itemId: v.id("giftItems"),
    giftRecipientId: v.id("giftRecipients"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.itemId, { giftRecipientId: args.giftRecipientId });
    return args.itemId;
  },
});

// Unassign a gift (move back to pool)
export const unassignGiftItem = mutation({
  args: {
    itemId: v.id("giftItems"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.itemId, { giftRecipientId: undefined });
    return args.itemId;
  },
});

export const updateGiftItem = mutation({
  args: {
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
    const { itemId, ...updates } = args;
    await ctx.db.patch(itemId, updates);
    return itemId;
  },
});

export const deleteGiftItem = mutation({
  args: { itemId: v.id("giftItems") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.itemId);
  },
});

// ==================== SUMMARY QUERIES ====================
export const getGiftEventSummary = query({
  args: { eventId: v.id("giftEvents") },
  handler: async (ctx, args) => {
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
  args: { eventId: v.id("giftEvents") },
  handler: async (ctx, args) => {
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
