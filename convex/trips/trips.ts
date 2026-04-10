import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireFamilyAccessFromSession } from "../lib/auth";
import { getTripWithAccessOrThrow } from "./access";

export const getTrips = query({
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    return await ctx.db
      .query("trips")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .order("desc")
      .collect();
  },
});

export const getTrip = query({
  args: { sessionToken: v.string(), tripId: v.id("trips") },
  handler: async (ctx, args) => {
    return await getTripWithAccessOrThrow(ctx, args.sessionToken, args.tripId);
  },
});

export const createTrip = mutation({
  args: {
    sessionToken: v.string(),
    familyId: v.id("families"),
    name: v.string(),
    destination: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    budget: v.optional(v.number()),
    description: v.optional(v.string()),
    placeListId: v.optional(v.id("placeLists")),
  },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    return await ctx.db.insert("trips", {
      familyId: args.familyId,
      name: args.name,
      destination: args.destination,
      startDate: args.startDate,
      endDate: args.endDate,
      status: "planning",
      budget: args.budget,
      description: args.description,
      placeListId: args.placeListId,
    });
  },
});

export const updateTrip = mutation({
  args: {
    sessionToken: v.string(),
    tripId: v.id("trips"),
    name: v.optional(v.string()),
    destination: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    status: v.optional(v.union(v.literal("planning"), v.literal("confirmed"), v.literal("active"), v.literal("completed"))),
    budget: v.optional(v.number()),
    description: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    placeListId: v.optional(v.union(v.id("placeLists"), v.null())),
  },
  handler: async (ctx, args) => {
    await getTripWithAccessOrThrow(ctx, args.sessionToken, args.tripId);
    const { tripId, sessionToken: _sessionToken, ...updates } = args;
    await ctx.db.patch(tripId, updates);
  },
});

export const deleteTrip = mutation({
  args: { sessionToken: v.string(), tripId: v.id("trips") },
  handler: async (ctx, args) => {
    await getTripWithAccessOrThrow(ctx, args.sessionToken, args.tripId);
    const plans = await ctx.db
      .query("tripPlans")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();

    for (const plan of plans) {
      await ctx.db.delete(plan._id);
    }

    const bookings = await ctx.db
      .query("tripBookings")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();

    for (const booking of bookings) {
      await ctx.db.delete(booking._id);
    }

    await ctx.db.delete(args.tripId);
  },
});
