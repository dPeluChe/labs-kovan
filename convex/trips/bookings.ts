import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getTripBookingWithAccessOrThrow, getTripWithAccessOrThrow } from "./access";

const BOOKING_TYPE = v.union(
  v.literal("flight"),
  v.literal("hotel"),
  v.literal("transport"),
  v.literal("rental"),
  v.literal("activity"),
  v.literal("other")
);

export const getTripBookings = query({
  args: { sessionToken: v.string(), tripId: v.id("trips") },
  handler: async (ctx, args) => {
    await getTripWithAccessOrThrow(ctx, args.sessionToken, args.tripId);
    return await ctx.db
      .query("tripBookings")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();
  },
});

export const addTripBooking = mutation({
  args: {
    sessionToken: v.string(),
    tripId: v.id("trips"),
    type: BOOKING_TYPE,
    provider: v.string(),
    confirmationCode: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    location: v.optional(v.string()),
    cost: v.optional(v.number()),
    currency: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getTripWithAccessOrThrow(ctx, args.sessionToken, args.tripId);
    const { sessionToken: _sessionToken, ...payload } = args;
    return await ctx.db.insert("tripBookings", payload);
  },
});

export const updateTripBooking = mutation({
  args: {
    sessionToken: v.string(),
    bookingId: v.id("tripBookings"),
    type: v.optional(BOOKING_TYPE),
    provider: v.optional(v.string()),
    confirmationCode: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    location: v.optional(v.string()),
    cost: v.optional(v.number()),
    currency: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getTripBookingWithAccessOrThrow(ctx, args.sessionToken, args.bookingId);
    const { bookingId, sessionToken: _sessionToken, ...updates } = args;
    await ctx.db.patch(bookingId, updates);
  },
});

export const deleteTripBooking = mutation({
  args: { sessionToken: v.string(), bookingId: v.id("tripBookings") },
  handler: async (ctx, args) => {
    await getTripBookingWithAccessOrThrow(ctx, args.sessionToken, args.bookingId);
    await ctx.db.delete(args.bookingId);
  },
});
