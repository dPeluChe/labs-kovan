import { v } from "convex/values";
import { action } from "../../_generated/server";
import { api } from "../../_generated/api";
import { assertActionFamilyAccess, refreshAccessToken } from "../shared";

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
