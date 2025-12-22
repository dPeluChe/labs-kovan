import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// ... (existing code)

export const getGoogleAuthUrl = action({
  args: { redirectUri: v.string() },
  handler: async (_ctx, args) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new Error("Google Client ID not configured on server");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: args.redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/calendar",
      access_type: "offline",
      prompt: "consent",
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },
});

// ...

// ... (previous code)

export const refreshCalendarFromGoogle = mutation({
  args: { familyId: v.id("families") },
  handler: async (_ctx, args) => {
    // Deprecated in favor of the action approach, but keeping for compatibility if UI calls it
    console.log(
      "Calendar refresh requested for family:",
      args.familyId
    );
    // Ideally trigger the action here if possible, or just return.
    return { success: true, message: "Use syncGoogleCalendar action instead" };
  },
});

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
  // ... (rest of file)
  args: {
    familyId: v.id("families"),
    calendarId: v.string(),
    displayName: v.string(),
    connectedBy: v.id("users"),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    tokenExpiry: v.optional(v.number()),
    scope: v.optional(v.string()),
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
      connectedBy: args.connectedBy,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      tokenExpiry: args.tokenExpiry,
      scope: args.scope,
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



// ==================== OAUTH ACTIONS ====================


export const exchangeGoogleAuthCode = action({
  args: { code: v.string(), redirectUri: v.string() },
  handler: async (_ctx, args) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error("Missing Google OAuth Credentials in Convex Env Variables");
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: args.code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: args.redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Google Token Error:", tokens);
      throw new Error(`Failed to exchange code: ${tokens.error_description || tokens.error}`);
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      scope: tokens.scope,
    };
  },
});

export const provisionKovanCalendar = action({
  args: { accessToken: v.string() },
  handler: async (_ctx, args) => {
    // 1. Check if calendar exists (loop through all pages)
    let pageToken: string | undefined = undefined;

    do {
      const listUrl = new URL("https://www.googleapis.com/calendar/v3/users/me/calendarList");
      if (pageToken) listUrl.searchParams.append("pageToken", pageToken);

      const listRes = await fetch(listUrl.toString(), {
        headers: { Authorization: `Bearer ${args.accessToken}` },
      });

      if (!listRes.ok) throw new Error("Failed to list calendars");

      const listData = await listRes.json() as { items?: { id: string; summary: string }[]; nextPageToken?: string };
      const items = listData.items || [];

      const existing = items.find(
        (c) => c.summary === "KOVAN - FAMILIA" || c.summary === "KOVAN FAMILIA"
      );

      if (existing) {
        console.log("Found existing KOVAN calendar:", existing.id);
        return { calendarId: existing.id, isNew: false };
      }

      pageToken = listData.nextPageToken;
    } while (pageToken);

    // 2. Create if not exists
    console.log("No existing KOVAN calendar found. Creating new one...");
    const createRes = await fetch("https://www.googleapis.com/calendar/v3/calendars", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        summary: "KOVAN - FAMILIA",
        description: "Calendario compartido para la gestión familiar en Kovan.",
        timeZone: "America/Mexico_City",
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(`Failed to create calendar: ${err.error?.message}`);
    }

    const newCal = await createRes.json();
    console.log("Created new KOVAN calendar:", newCal.id);
    return { calendarId: newCal.id, isNew: true };
  },
});

export const listGoogleCalendarsAction = action({
  args: { accessToken: v.string() },
  handler: async (_ctx, args) => {
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader",
      { headers: { Authorization: `Bearer ${args.accessToken}` } }
    );
    if (!response.ok) throw new Error("Failed to list calendars");

    // Type the response minimally
    type CalendarItem = {
      id: string;
      summary: string;
      primary?: boolean;
      backgroundColor?: string;
    };
    const data = await response.json() as { items: CalendarItem[] };

    return data.items.map((c) => ({
      id: c.id,
      summary: c.summary,
      primary: c.primary,
      color: c.backgroundColor,
    }));
  },
});

// ==================== GOOGLE API ACTIONS ====================

export const fetchGoogleEventsAction = action({
  args: {
    accessToken: v.string(),
    calendarId: v.string(),
    timeMin: v.string(),
    timeMax: v.string()
  },
  handler: async (_ctx, args) => {
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(args.calendarId)}/events`);
    url.searchParams.append("timeMin", args.timeMin);
    url.searchParams.append("timeMax", args.timeMax);
    url.searchParams.append("singleEvents", "true");
    url.searchParams.append("orderBy", "startTime");
    url.searchParams.append("maxResults", "100");

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("UNAUTHORIZED");
      }
      const err = await response.json();
      throw new Error(`Google Calendar API Error: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log(`Fetched ${data.items?.length || 0} events from Google`);
    return data.items || [];
  },
});

export const createGoogleEventAction = action({
  args: {
    accessToken: v.string(),
    calendarId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    location: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const event = {
      summary: args.title,
      description: args.description,
      location: args.location,
      start: {
        dateTime: new Date(args.startTime).toISOString(),
        timeZone: "America/Mexico_City",
      },
      end: {
        dateTime: new Date(args.endTime).toISOString(),
        timeZone: "America/Mexico_City",
      },
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(args.calendarId)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${args.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Failed to create event: ${err.error?.message}`);
    }

    return await response.json();
  },
});

export const updateGoogleEventAction = action({
  args: {
    accessToken: v.string(),
    calendarId: v.string(),
    eventId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    location: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const event = {
      summary: args.title,
      description: args.description,
      location: args.location,
      start: {
        dateTime: new Date(args.startTime).toISOString(),
        timeZone: "America/Mexico_City",
      },
      end: {
        dateTime: new Date(args.endTime).toISOString(),
        timeZone: "America/Mexico_City",
      },
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(args.calendarId)}/events/${encodeURIComponent(args.eventId)}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${args.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Failed to update event: ${err.error?.message}`);
    }

    return await response.json();
  },
});

export const deleteGoogleEventAction = action({
  args: {
    accessToken: v.string(),
    calendarId: v.string(),
    eventId: v.string(),
  },
  handler: async (_ctx, args) => {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(args.calendarId)}/events/${encodeURIComponent(args.eventId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${args.accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 404 && response.status !== 410) { // Ignore not found/gone
      const err = await response.json();
      throw new Error(`Failed to delete event: ${err.error?.message}`);
    }

    return { success: true };
  },
});

// ==================== ORCHESTRATION ====================

export const syncGoogleCalendar = action({
  args: { familyId: v.id("families") },
  handler: async (ctx, args): Promise<{ success: boolean; count?: number; error?: string } | undefined> => {
    // 1. Get Integration Settings
    // We need to call a query from this action. Convex allows this if we define the query exposed.
    // However, it's often cleaner to pass the necessary data or use `runQuery`.
    // For simplicity in this structure, we'll assume we pass data or fetch it.
    // Wait, `action` context has `runQuery`.

    const integration = await ctx.runQuery(api.calendar.getCalendarIntegration, { familyId: args.familyId });
    if (!integration || !integration.accessToken) {
      console.log("No integration or access token found for syncing.");
      return;
    }

    // 2. Fetch Events
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString(); // Start of current month
    const end = new Date(now.getFullYear(), now.getMonth() + 3, 1).toISOString(); // 3 months out

    try {
      // 2. Determine calendars to sync
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

      // 3. Fetch from all calendars (parallel)
      const promises = calendarsToSync.map(async (calId) => {
        const calEvents = await ctx.runAction(api.calendar.fetchGoogleEventsAction, {
          accessToken: integration.accessToken!,
          calendarId: calId,
          timeMin: start,
          timeMax: end,
        }) as GoogleEvent[];

        // Tag events with their source calendar ID
        return calEvents.map((e) => ({ ...e, _calendarId: calId }));
      });

      const results = await Promise.all(promises);
      results.forEach(res => allEvents.push(...res));

      // 4. Transform and Save
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
    familyId: v.id("families"),
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Get Integration
    const integration = await ctx.runQuery(api.calendar.getCalendarIntegration, { familyId: args.familyId });
    if (!integration || !integration.accessToken) {
      throw new Error("Calendar not connected");
    }

    // 2. Create Event in Google
    await ctx.runAction(api.calendar.createGoogleEventAction, {
      accessToken: integration.accessToken,
      calendarId: integration.calendarId,
      title: args.title,
      description: args.description,
      startTime: args.startTime,
      endTime: args.endTime,
      location: args.location,
    });

    // 3. Trigger Sync to update local cache immediately
    await ctx.runAction(api.calendar.syncGoogleCalendar, { familyId: args.familyId });

    return { success: true };
  },
});

export const updateEvent = action({
  args: {
    familyId: v.id("families"),
    eventId: v.string(), // Google Event ID
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Get Integration
    const integration = await ctx.runQuery(api.calendar.getCalendarIntegration, { familyId: args.familyId });
    if (!integration || !integration.accessToken) {
      throw new Error("Calendar not connected");
    }

    // 2. Update Event in Google
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

    // 3. Trigger Sync
    await ctx.runAction(api.calendar.syncGoogleCalendar, { familyId: args.familyId });

    return { success: true };
  },
});

export const deleteEvent = action({
  args: {
    familyId: v.id("families"),
    eventId: v.string(), // Google Event ID
  },
  handler: async (ctx, args) => {
    // 1. Get Integration
    const integration = await ctx.runQuery(api.calendar.getCalendarIntegration, { familyId: args.familyId });
    if (!integration || !integration.accessToken) {
      throw new Error("Calendar not connected");
    }

    // 2. Delete Event in Google
    await ctx.runAction(api.calendar.deleteGoogleEventAction, {
      accessToken: integration.accessToken,
      calendarId: integration.calendarId,
      eventId: args.eventId,
    });

    // 3. Trigger Sync
    await ctx.runAction(api.calendar.syncGoogleCalendar, { familyId: args.familyId });

    return { success: true };
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
        calendarId: v.optional(v.string()), // Source calendar
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

    // Update last sync time
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
    familyId: v.id("families"),
    calendarId: v.optional(v.string()),
    syncedCalendarIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
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



