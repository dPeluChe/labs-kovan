
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireFamilyAccessFromSession } from "./lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getTripWithAccessOrThrow(ctx: any, sessionToken: string, tripId: any) {
    const trip = await ctx.db.get(tripId);
    if (!trip) throw new Error("Viaje no encontrado");
    await requireFamilyAccessFromSession(ctx, sessionToken, trip.familyId);
    return trip;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getTripPlanWithAccessOrThrow(ctx: any, sessionToken: string, planId: any) {
    const plan = await ctx.db.get(planId);
    if (!plan) throw new Error("Plan no encontrado");
    await getTripWithAccessOrThrow(ctx, sessionToken, plan.tripId);
    return plan;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getTripBookingWithAccessOrThrow(ctx: any, sessionToken: string, bookingId: any) {
    const booking = await ctx.db.get(bookingId);
    if (!booking) throw new Error("Reserva no encontrada");
    await getTripWithAccessOrThrow(ctx, sessionToken, booking.tripId);
    return booking;
}

// ==================== TRIPS ====================

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
        // Delete all plans associated with the trip
        const plans = await ctx.db
            .query("tripPlans")
            .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
            .collect();

        for (const plan of plans) {
            await ctx.db.delete(plan._id);
        }

        // Delete all bookings associated with the trip
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

// ==================== TRIP BOOKINGS (COMMODITIES) ====================

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
        type: v.union(
            v.literal("flight"),
            v.literal("hotel"),
            v.literal("transport"),
            v.literal("rental"),
            v.literal("activity"),
            v.literal("other")
        ),
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
        type: v.optional(v.union(
            v.literal("flight"),
            v.literal("hotel"),
            v.literal("transport"),
            v.literal("rental"),
            v.literal("activity"),
            v.literal("other")
        )),
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

// ==================== TRIP PLANS (ITINERARY) ====================

export const getTripPlans = query({
    args: { sessionToken: v.string(), tripId: v.id("trips") },
    handler: async (ctx, args) => {
        await getTripWithAccessOrThrow(ctx, args.sessionToken, args.tripId);
        const plans = await ctx.db
            .query("tripPlans")
            .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
            .collect();

        // Sort logic (can be memory or separate index)
        // Sorting by date (asc) then order (asc)
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
        // Find highest order for this day/bucket to append
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
        if (plan) {
            await ctx.db.patch(args.planId, { isCompleted: !plan.isCompleted });
        }
    }
});
