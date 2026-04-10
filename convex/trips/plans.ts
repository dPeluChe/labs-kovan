import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getTripPlanWithAccessOrThrow, getTripWithAccessOrThrow } from "./access";

export const getTripPlans = query({
  args: { sessionToken: v.string(), tripId: v.id("trips") },
  handler: async (ctx, args) => {
    await getTripWithAccessOrThrow(ctx, args.sessionToken, args.tripId);
    const plans = await ctx.db
      .query("tripPlans")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();

    return plans.sort((a, b) => {
      if ((a.dayDate || 0) !== (b.dayDate || 0)) {
        return (a.dayDate || 0) - (b.dayDate || 0);
      }
      return a.order - b.order;
    });
  },
});

export const getTripPlan = query({
  args: { sessionToken: v.string(), planId: v.id("tripPlans") },
  handler: async (ctx, args) => {
    return await getTripPlanWithAccessOrThrow(ctx, args.sessionToken, args.planId);
  },
});

export const addTripPlan = mutation({
  args: {
    sessionToken: v.string(),
    tripId: v.id("trips"),
    dayDate: v.optional(v.number()),
    time: v.optional(v.string()),
    placeId: v.optional(v.id("places")),
    activity: v.string(),
    notes: v.optional(v.string()),
    cost: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getTripWithAccessOrThrow(ctx, args.sessionToken, args.tripId);
    const existing = await ctx.db
      .query("tripPlans")
      .withIndex("by_trip_date", (q) => q.eq("tripId", args.tripId).eq("dayDate", args.dayDate))
      .collect();

    const maxOrder = existing.reduce((max, curr) => Math.max(max, curr.order), 0);

    return await ctx.db.insert("tripPlans", {
      tripId: args.tripId,
      dayDate: args.dayDate,
      time: args.time,
      placeId: args.placeId,
      activity: args.activity,
      notes: args.notes,
      cost: args.cost,
      isCompleted: false,
      order: maxOrder + 1,
    });
  },
});

export const updateTripPlan = mutation({
  args: {
    sessionToken: v.string(),
    planId: v.id("tripPlans"),
    dayDate: v.optional(v.number()),
    time: v.optional(v.string()),
    order: v.optional(v.number()),
    activity: v.optional(v.string()),
    notes: v.optional(v.string()),
    isCompleted: v.optional(v.boolean()),
    cost: v.optional(v.number()),
    placeId: v.optional(v.id("places")),
  },
  handler: async (ctx, args) => {
    await getTripPlanWithAccessOrThrow(ctx, args.sessionToken, args.planId);
    const { planId, sessionToken: _sessionToken, ...updates } = args;
    await ctx.db.patch(planId, updates);
  },
});

export const deleteTripPlan = mutation({
  args: { sessionToken: v.string(), planId: v.id("tripPlans") },
  handler: async (ctx, args) => {
    await getTripPlanWithAccessOrThrow(ctx, args.sessionToken, args.planId);
    await ctx.db.delete(args.planId);
  },
});

export const togglePlanCompletion = mutation({
  args: { sessionToken: v.string(), planId: v.id("tripPlans") },
  handler: async (ctx, args) => {
    const plan = await getTripPlanWithAccessOrThrow(ctx, args.sessionToken, args.planId);
    await ctx.db.patch(args.planId, { isCompleted: !plan.isCompleted });
  },
});
