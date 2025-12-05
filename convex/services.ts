import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==================== SERVICES ====================
export const getServices = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("services")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();
  },
});

export const createService = mutation({
  args: {
    familyId: v.id("families"),
    type: v.union(
      v.literal("electricity"),
      v.literal("water"),
      v.literal("internet"),
      v.literal("rent"),
      v.literal("gas"),
      v.literal("other")
    ),
    name: v.string(),
    billingCycle: v.union(
      v.literal("monthly"),
      v.literal("bimonthly"),
      v.literal("annual"),
      v.literal("other")
    ),
    dueDay: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("services", args);
  },
});

export const updateService = mutation({
  args: {
    serviceId: v.id("services"),
    type: v.optional(
      v.union(
        v.literal("electricity"),
        v.literal("water"),
        v.literal("internet"),
        v.literal("rent"),
        v.literal("gas"),
        v.literal("other")
      )
    ),
    name: v.optional(v.string()),
    billingCycle: v.optional(
      v.union(
        v.literal("monthly"),
        v.literal("bimonthly"),
        v.literal("annual"),
        v.literal("other")
      )
    ),
    dueDay: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { serviceId, ...updates } = args;
    await ctx.db.patch(serviceId, updates);
    return serviceId;
  },
});

export const deleteService = mutation({
  args: { serviceId: v.id("services") },
  handler: async (ctx, args) => {
    // Delete all payments
    const payments = await ctx.db
      .query("servicePayments")
      .withIndex("by_service", (q) => q.eq("serviceId", args.serviceId))
      .collect();
    for (const payment of payments) {
      await ctx.db.delete(payment._id);
    }
    await ctx.db.delete(args.serviceId);
  },
});

// ==================== SERVICE PAYMENTS ====================
export const getServicePayments = query({
  args: { serviceId: v.id("services") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("servicePayments")
      .withIndex("by_service", (q) => q.eq("serviceId", args.serviceId))
      .collect();
  },
});

export const createServicePayment = mutation({
  args: {
    serviceId: v.id("services"),
    periodLabel: v.string(),
    amount: v.number(),
    paidDate: v.number(),
    paymentMethod: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("servicePayments", args);
  },
});

export const deleteServicePayment = mutation({
  args: { paymentId: v.id("servicePayments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.paymentId);
  },
});

// ==================== VEHICLES ====================
export const getVehicles = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("vehicles")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();
  },
});

export const createVehicle = mutation({
  args: {
    familyId: v.id("families"),
    name: v.string(),
    plate: v.optional(v.string()),
    brand: v.optional(v.string()),
    model: v.optional(v.string()),
    year: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("vehicles", args);
  },
});

export const updateVehicle = mutation({
  args: {
    vehicleId: v.id("vehicles"),
    name: v.optional(v.string()),
    plate: v.optional(v.string()),
    brand: v.optional(v.string()),
    model: v.optional(v.string()),
    year: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { vehicleId, ...updates } = args;
    await ctx.db.patch(vehicleId, updates);
    return vehicleId;
  },
});

export const deleteVehicle = mutation({
  args: { vehicleId: v.id("vehicles") },
  handler: async (ctx, args) => {
    // Delete all events
    const events = await ctx.db
      .query("vehicleEvents")
      .withIndex("by_vehicle", (q) => q.eq("vehicleId", args.vehicleId))
      .collect();
    for (const event of events) {
      await ctx.db.delete(event._id);
    }
    await ctx.db.delete(args.vehicleId);
  },
});

// ==================== VEHICLE EVENTS ====================
export const getVehicleEvents = query({
  args: { vehicleId: v.id("vehicles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("vehicleEvents")
      .withIndex("by_vehicle", (q) => q.eq("vehicleId", args.vehicleId))
      .collect();
  },
});

export const createVehicleEvent = mutation({
  args: {
    vehicleId: v.id("vehicles"),
    type: v.union(
      v.literal("verification"),
      v.literal("service"),
      v.literal("insurance"),
      v.literal("other")
    ),
    title: v.string(),
    date: v.number(),
    amount: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("vehicleEvents", args);
  },
});

export const updateVehicleEvent = mutation({
  args: {
    eventId: v.id("vehicleEvents"),
    type: v.optional(
      v.union(
        v.literal("verification"),
        v.literal("service"),
        v.literal("insurance"),
        v.literal("other")
      )
    ),
    title: v.optional(v.string()),
    date: v.optional(v.number()),
    amount: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { eventId, ...updates } = args;
    await ctx.db.patch(eventId, updates);
    return eventId;
  },
});

export const deleteVehicleEvent = mutation({
  args: { eventId: v.id("vehicleEvents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.eventId);
  },
});

// ==================== SUMMARY ====================
export const getServicesSummary = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    const services = await ctx.db
      .query("services")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();

    const vehicles = await ctx.db
      .query("vehicles")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();

    // Get upcoming vehicle events (next 30 days)
    const now = Date.now();
    const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;

    const upcomingVehicleEvents: Array<{
      vehicleName: string;
      event: { type: string; title: string; date: number };
    }> = [];

    for (const vehicle of vehicles) {
      const events = await ctx.db
        .query("vehicleEvents")
        .withIndex("by_vehicle", (q) => q.eq("vehicleId", vehicle._id))
        .collect();

      for (const event of events) {
        if (event.date >= now && event.date <= thirtyDaysFromNow) {
          upcomingVehicleEvents.push({
            vehicleName: vehicle.name,
            event: { type: event.type, title: event.title, date: event.date },
          });
        }
      }
    }

    upcomingVehicleEvents.sort((a, b) => a.event.date - b.event.date);

    return {
      serviceCount: services.length,
      vehicleCount: vehicles.length,
      upcomingVehicleEvents: upcomingVehicleEvents.slice(0, 5),
    };
  },
});
