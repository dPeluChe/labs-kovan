import { v } from "convex/values";
import { action } from "../../_generated/server";

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
