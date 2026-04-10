import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { assertActionFamilyAccess } from "./shared";

export const syncGoogleCalendar = action({
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args): Promise<{ success: boolean; count?: number; error?: string } | undefined> => {
    await assertActionFamilyAccess(ctx, args.sessionToken, args.familyId);
    const integration = await ctx.runQuery(api.calendar.getCalendarIntegration, {
      sessionToken: args.sessionToken,
      familyId: args.familyId,
    });
    if (!integration || !integration.accessToken) {
      console.log("No integration or access token found for syncing.");
      return;
    }

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() + 3, 1).toISOString();

    try {
      const calendarsToSync = (integration.syncedCalendarIds && integration.syncedCalendarIds.length > 0)
        ? integration.syncedCalendarIds
        : [integration.calendarId];

      interface GoogleEvent {
        id: string;
        summary?: string;
        description?: string;
        location?: string;
        start: { dateTime?: string; date?: string };
        end: { dateTime?: string; date?: string };
        _calendarId?: string;
      }

      const allEvents: GoogleEvent[] = [];

      const promises = calendarsToSync.map(async (calId) => {
        const calEvents = await ctx.runAction(api.calendar.fetchGoogleEventsAction, {
          accessToken: integration.accessToken!,
          calendarId: calId,
          timeMin: start,
          timeMax: end,
        }) as GoogleEvent[];

        return calEvents.map((e) => ({ ...e, _calendarId: calId }));
      });

      const results = await Promise.all(promises);
      results.forEach((res) => allEvents.push(...res));

      const formattedEvents = allEvents.map((e) => ({
        externalId: e.id,
        calendarId: e._calendarId,
        title: e.summary || "(Sin título)",
        description: e.description,
        startDateTime: new Date(e.start.dateTime || e.start.date!).getTime(),
        endDateTime: new Date(e.end.dateTime || e.end.date!).getTime(),
        location: e.location,
        allDay: !!e.start.date,
      }));

      await ctx.runMutation(api.calendar.syncCalendarEvents, {
        sessionToken: args.sessionToken,
        familyId: args.familyId,
        events: formattedEvents,
      });

      return { success: true, count: formattedEvents.length };
    } catch (error) {
      console.error("Sync failed:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  },
});

export const createEvent = action({
  args: {
    sessionToken: v.string(),
    familyId: v.id("families"),
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertActionFamilyAccess(ctx, args.sessionToken, args.familyId);
    const integration = await ctx.runQuery(api.calendar.getCalendarIntegration, {
      sessionToken: args.sessionToken,
      familyId: args.familyId,
    });
    if (!integration || !integration.accessToken) {
      throw new Error("Calendar not connected");
    }

    await ctx.runAction(api.calendar.createGoogleEventAction, {
      accessToken: integration.accessToken,
      calendarId: integration.calendarId,
      title: args.title,
      description: args.description,
      startTime: args.startTime,
      endTime: args.endTime,
      location: args.location,
    });

    await ctx.runAction(api.calendar.syncGoogleCalendar, {
      sessionToken: args.sessionToken,
      familyId: args.familyId,
    });

    return { success: true };
  },
});

export const updateEvent = action({
  args: {
    sessionToken: v.string(),
    familyId: v.id("families"),
    eventId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertActionFamilyAccess(ctx, args.sessionToken, args.familyId);
    const integration = await ctx.runQuery(api.calendar.getCalendarIntegration, {
      sessionToken: args.sessionToken,
      familyId: args.familyId,
    });
    if (!integration || !integration.accessToken) {
      throw new Error("Calendar not connected");
    }

    await ctx.runAction(api.calendar.updateGoogleEventAction, {
      accessToken: integration.accessToken,
      calendarId: integration.calendarId,
      eventId: args.eventId,
      title: args.title,
      description: args.description,
      startTime: args.startTime,
      endTime: args.endTime,
      location: args.location,
    });

    await ctx.runAction(api.calendar.syncGoogleCalendar, {
      sessionToken: args.sessionToken,
      familyId: args.familyId,
    });

    return { success: true };
  },
});

export const deleteEvent = action({
  args: {
    sessionToken: v.string(),
    familyId: v.id("families"),
    eventId: v.string(),
  },
  handler: async (ctx, args) => {
    await assertActionFamilyAccess(ctx, args.sessionToken, args.familyId);
    const integration = await ctx.runQuery(api.calendar.getCalendarIntegration, {
      sessionToken: args.sessionToken,
      familyId: args.familyId,
    });
    if (!integration || !integration.accessToken) {
      throw new Error("Calendar not connected");
    }

    await ctx.runAction(api.calendar.deleteGoogleEventAction, {
      accessToken: integration.accessToken,
      calendarId: integration.calendarId,
      eventId: args.eventId,
    });

    await ctx.runAction(api.calendar.syncGoogleCalendar, {
      sessionToken: args.sessionToken,
      familyId: args.familyId,
    });

    return { success: true };
  },
});
