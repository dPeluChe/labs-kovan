import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getEventWithAccessOrThrow, getRecipientWithAccessOrThrow } from "./access";

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
