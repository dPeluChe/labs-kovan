import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireUserFromSessionToken } from "../lib/auth";
import { getEventWithAccessOrThrow, getItemWithAccessOrThrow, getRecipientWithAccessOrThrow } from "./access";

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

export const getUnassignedGifts = query({
  args: { sessionToken: v.string(), eventId: v.id("giftEvents") },
  handler: async (ctx, args) => {
    await getEventWithAccessOrThrow(ctx, args.sessionToken, args.eventId);
    const allItems = await ctx.db
      .query("giftItems")
      .withIndex("by_event", (q) => q.eq("giftEventId", args.eventId))
      .collect();

    return allItems.filter((item) => !item.giftRecipientId);
  },
});

export const createGiftItem = mutation({
  args: {
    sessionToken: v.string(),
    giftEventId: v.id("giftEvents"),
    giftRecipientId: v.optional(v.id("giftRecipients")),
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
    const { item: currentItem, event } = await getItemWithAccessOrThrow(ctx, args.sessionToken, itemId);

    await ctx.db.patch(itemId, updates);

    if (
      args.status === "bought" &&
      currentItem.status !== "bought" &&
      currentItem.priceEstimate
    ) {
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
