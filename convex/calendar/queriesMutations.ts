import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireFamilyAccessFromSession, requireUserFromSessionToken } from "../lib/auth";

export const refreshCalendarFromGoogle = mutation({
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    // Deprecated in favor of the action approach, but keeping for compatibility if UI calls it
    console.log("Calendar refresh requested for family:", args.familyId);
    return { success: true, message: "Use syncGoogleCalendar action instead" };
  },
});

export const getCalendarIntegration = query({
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    return await ctx.db
      .query("calendarIntegrations")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .first();
  },
});

export const saveCalendarIntegration = mutation({
  args: {
    sessionToken: v.string(),
    familyId: v.id("families"),
    calendarId: v.string(),
    displayName: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    tokenExpiry: v.optional(v.number()),
    scope: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserFromSessionToken(ctx, args.sessionToken);
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const existing = await ctx.db
      .query("calendarIntegrations")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        calendarId: args.calendarId,
        displayName: args.displayName,
        connectedBy: user._id,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        tokenExpiry: args.tokenExpiry,
        scope: args.scope,
      });
      return existing._id;
    }

    return await ctx.db.insert("calendarIntegrations", {
      familyId: args.familyId,
      provider: "google",
      calendarId: args.calendarId,
      displayName: args.displayName,
      connectedBy: user._id,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      tokenExpiry: args.tokenExpiry,
      scope: args.scope,
    });
  },
});

export const removeCalendarIntegration = mutation({
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const integration = await ctx.db
      .query("calendarIntegrations")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .first();

    if (integration) {
      const events = await ctx.db
        .query("cachedCalendarEvents")
        .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
        .collect();
      for (const event of events) {
        await ctx.db.delete(event._id);
      }
      await ctx.db.delete(integration._id);
    }
  },
});

export const getCachedEvents = query({
  args: {
    sessionToken: v.string(),
    familyId: v.id("families"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const events = await ctx.db
      .query("cachedCalendarEvents")
      .withIndex("by_family_start", (q) => q.eq("familyId", args.familyId))
      .collect();

    if (args.startDate || args.endDate) {
      return events.filter((e) => {
        if (args.startDate && e.startDateTime < args.startDate) return false;
        if (args.endDate && e.startDateTime > args.endDate) return false;
        return true;
      });
    }

    return events;
  },
});

export const getUpcomingEvents = query({
  args: { sessionToken: v.string(), familyId: v.id("families"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const now = Date.now();
    const events = await ctx.db
      .query("cachedCalendarEvents")
      .withIndex("by_family_start", (q) => q.eq("familyId", args.familyId))
      .collect();

    const upcoming = events
      .filter((e) => e.startDateTime >= now)
      .sort((a, b) => a.startDateTime - b.startDateTime);

    return upcoming.slice(0, args.limit || 10);
  },
});

export const syncCalendarEvents = mutation({
  args: {
    sessionToken: v.string(),
    familyId: v.id("families"),
    events: v.array(
      v.object({
        externalId: v.string(),
        calendarId: v.optional(v.string()),
        title: v.string(),
        description: v.optional(v.string()),
        startDateTime: v.number(),
        endDateTime: v.number(),
        location: v.optional(v.string()),
        allDay: v.boolean(),
        colorId: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const existingEvents = await ctx.db
      .query("cachedCalendarEvents")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();

    for (const event of existingEvents) {
      await ctx.db.delete(event._id);
    }

    for (const event of args.events) {
      await ctx.db.insert("cachedCalendarEvents", {
        familyId: args.familyId,
        ...event,
      });
    }

    const integration = await ctx.db
      .query("calendarIntegrations")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .first();

    if (integration) {
      await ctx.db.patch(integration._id, { lastSync: Date.now() });
    }

    return args.events.length;
  },
});

export const updateCalendarSettings = mutation({
  args: {
    sessionToken: v.string(),
    familyId: v.id("families"),
    calendarId: v.optional(v.string()),
    syncedCalendarIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const integration = await ctx.db
      .query("calendarIntegrations")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .first();

    if (!integration) throw new Error("No integration found");

    await ctx.db.patch(integration._id, {
      calendarId: args.calendarId ?? integration.calendarId,
      syncedCalendarIds: args.syncedCalendarIds ?? integration.syncedCalendarIds,
    });
  },
});
