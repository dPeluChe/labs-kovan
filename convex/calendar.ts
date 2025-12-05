import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==================== CALENDAR INTEGRATIONS ====================
export const getCalendarIntegration = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("calendarIntegrations")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .first();
  },
});

export const saveCalendarIntegration = mutation({
  args: {
    familyId: v.id("families"),
    calendarId: v.string(),
    displayName: v.string(),
    connectedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if integration exists
    const existing = await ctx.db
      .query("calendarIntegrations")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        calendarId: args.calendarId,
        displayName: args.displayName,
        connectedBy: args.connectedBy,
      });
      return existing._id;
    }

    return await ctx.db.insert("calendarIntegrations", {
      familyId: args.familyId,
      provider: "google",
      calendarId: args.calendarId,
      displayName: args.displayName,
      connectedBy: args.connectedBy,
    });
  },
});

export const removeCalendarIntegration = mutation({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    const integration = await ctx.db
      .query("calendarIntegrations")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .first();

    if (integration) {
      // Also delete cached events
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

// ==================== CACHED EVENTS ====================
export const getCachedEvents = query({
  args: {
    familyId: v.id("families"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("cachedCalendarEvents")
      .withIndex("by_family_start", (q) => q.eq("familyId", args.familyId))
      .collect();

    // Filter by date range if provided
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
  args: { familyId: v.id("families"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
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
    familyId: v.id("families"),
    events: v.array(
      v.object({
        externalId: v.string(),
        title: v.string(),
        startDateTime: v.number(),
        endDateTime: v.number(),
        location: v.optional(v.string()),
        allDay: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Delete existing cached events for this family
    const existingEvents = await ctx.db
      .query("cachedCalendarEvents")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();

    for (const event of existingEvents) {
      await ctx.db.delete(event._id);
    }

    // Insert new events
    for (const event of args.events) {
      await ctx.db.insert("cachedCalendarEvents", {
        familyId: args.familyId,
        ...event,
      });
    }

    return args.events.length;
  },
});

// Placeholder for future Google Calendar API integration
// In a real implementation, this would be a Convex action that calls Google's API
export const refreshCalendarFromGoogle = mutation({
  args: { familyId: v.id("families") },
  handler: async (_ctx, args) => {
    // This is a placeholder
    // In production, you would:
    // 1. Get the calendar integration for this family
    // 2. Use the Google Calendar API to fetch events
    // 3. Call syncCalendarEvents with the fetched data

    console.log(
      "Calendar refresh requested for family:",
      args.familyId
    );
    return { success: true, message: "Calendar sync not yet implemented" };
  },
});
