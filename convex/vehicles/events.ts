import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireUserFromSessionToken } from "../lib/auth";
import { getVehicleEventWithAccessOrThrow, getVehicleWithAccessOrThrow } from "./access";

const VEHICLE_EVENT_TYPE = v.union(
  v.literal("verification"),
  v.literal("service"),
  v.literal("insurance"),
  v.literal("fuel"),
  v.literal("repair"),
  v.literal("other")
);

export const getVehicleEvents = query({
  args: { sessionToken: v.string(), vehicleId: v.id("vehicles") },
  handler: async (ctx, args) => {
    await getVehicleWithAccessOrThrow(ctx, args.sessionToken, args.vehicleId);
    return await ctx.db
      .query("vehicleEvents")
      .withIndex("by_vehicle", (q) => q.eq("vehicleId", args.vehicleId))
      .collect();
  },
});

export const createVehicleEvent = mutation({
  args: {
    sessionToken: v.string(),
    vehicleId: v.id("vehicles"),
    type: VEHICLE_EVENT_TYPE,
    title: v.string(),
    date: v.number(),
    nextDate: v.optional(v.number()),
    odometer: v.optional(v.number()),
    amount: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserFromSessionToken(ctx, args.sessionToken);
    const vehicle = await getVehicleWithAccessOrThrow(ctx, args.sessionToken, args.vehicleId);
    const { sessionToken: _sessionToken, ...eventData } = args;

    const eventId = await ctx.db.insert("vehicleEvents", eventData);

    if (args.amount && args.amount > 0) {
      await ctx.db.insert("expenses", {
        familyId: vehicle.familyId,
        type: "vehicle",
        category: "vehicle",
        description: `${vehicle?.name || "Auto"}: ${args.title}`,
        amount: args.amount,
        date: args.date,
        paidBy: user._id,
        vehicleId: args.vehicleId,
        vehicleEventId: eventId,
        notes: args.notes,
      });
    }

    return eventId;
  },
});

export const updateVehicleEvent = mutation({
  args: {
    sessionToken: v.string(),
    eventId: v.id("vehicleEvents"),
    type: v.optional(VEHICLE_EVENT_TYPE),
    title: v.optional(v.string()),
    date: v.optional(v.number()),
    nextDate: v.optional(v.number()),
    odometer: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getVehicleEventWithAccessOrThrow(ctx, args.sessionToken, args.eventId);
    const { eventId, sessionToken: _sessionToken, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(eventId, filteredUpdates);
    return eventId;
  },
});

export const deleteVehicleEvent = mutation({
  args: { sessionToken: v.string(), eventId: v.id("vehicleEvents") },
  handler: async (ctx, args) => {
    await getVehicleEventWithAccessOrThrow(ctx, args.sessionToken, args.eventId);
    const expenses = await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("vehicleEventId"), args.eventId))
      .collect();

    for (const expense of expenses) {
      await ctx.db.delete(expense._id);
    }

    await ctx.db.delete(args.eventId);
  },
});
