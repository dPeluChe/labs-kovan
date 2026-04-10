import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireFamilyAccessFromSession, requireUserFromSessionToken } from "../lib/auth";
import { getEventWithAccessOrThrow } from "./access";

export const getGiftEvents = query({
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);

    const events = await ctx.db
      .query("giftEvents")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();

    return events.sort((a, b) => {
      if (a.date && b.date) {
        return a.date - b.date;
      }
      if (a.date && !b.date) return -1;
      if (!a.date && b.date) return 1;
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
