import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { assertActionFamilyAccess, refreshAccessToken } from "./shared";

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

    console.log("No existing KOVAN calendar found. Creating new one...");
    const createRes = await fetch("https://www.googleapis.com/calendar/v3/calendars", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
        "Content-Type": "application/json",
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
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args) => {
    await assertActionFamilyAccess(ctx, args.sessionToken, args.familyId);
    const integration = await ctx.runQuery(api.calendar.getCalendarIntegration, {
      sessionToken: args.sessionToken,
      familyId: args.familyId,
    });
    if (!integration || !integration.accessToken) throw new Error("No calendar integration found");

    const fetchList = async (token: string) => {
      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 401) throw new Error("UNAUTHORIZED");
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to list calendars: ${response.status} ${text}`);
      }
      return await response.json();
    };

    let data;
    try {
      data = await fetchList(integration.accessToken);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "UNAUTHORIZED" && integration.refreshToken) {
        console.log("Token expired, refreshing...");
        const tokens = await refreshAccessToken(integration.refreshToken);

        await ctx.runMutation(api.calendar.saveCalendarIntegration, {
          sessionToken: args.sessionToken,
          familyId: args.familyId,
          calendarId: integration.calendarId,
          displayName: integration.displayName,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || integration.refreshToken,
          tokenExpiry: Date.now() + (tokens.expires_in * 1000),
          scope: tokens.scope || integration.scope,
        });

        data = await fetchList(tokens.access_token);
      } else {
        throw err;
      }
    }

    type CalendarItem = {
      id: string;
      summary: string;
      primary?: boolean;
      backgroundColor?: string;
    };

    return ((data as { items: CalendarItem[] }).items).map((c) => ({
      id: c.id,
      summary: c.summary,
      primary: c.primary,
      color: c.backgroundColor,
    }));
  },
});

export const fetchGoogleEventsAction = action({
  args: {
    accessToken: v.string(),
    calendarId: v.string(),
    timeMin: v.string(),
    timeMax: v.string(),
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

    if (!response.ok && response.status !== 404 && response.status !== 410) {
      const err = await response.json();
      throw new Error(`Failed to delete event: ${err.error?.message}`);
    }

    return { success: true };
  },
});
