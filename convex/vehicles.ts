import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireFamilyAccessFromSession, requireUserFromSessionToken } from "./lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getVehicleWithAccessOrThrow(ctx: any, sessionToken: string, vehicleId: any) {
  const vehicle = await ctx.db.get(vehicleId);
  if (!vehicle) throw new Error("Vehículo no encontrado");
  await requireFamilyAccessFromSession(ctx, sessionToken, vehicle.familyId);
  return vehicle;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getVehicleEventWithAccessOrThrow(ctx: any, sessionToken: string, eventId: any) {
  const event = await ctx.db.get(eventId);
  if (!event) throw new Error("Evento no encontrado");
  const vehicle = await getVehicleWithAccessOrThrow(ctx, sessionToken, event.vehicleId);
  return { event, vehicle };
}

// ==================== VEHICLES ====================
export const getVehicles = query({
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    return await ctx.db
      .query("vehicles")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();
  },
});

export const getVehicle = query({
  args: { sessionToken: v.string(), vehicleId: v.id("vehicles") },
  handler: async (ctx, args) => {
    return await getVehicleWithAccessOrThrow(ctx, args.sessionToken, args.vehicleId);
  },
});

export const createVehicle = mutation({
  args: {
    sessionToken: v.string(),
    familyId: v.id("families"),
    name: v.string(),
    plate: v.optional(v.string()),
    brand: v.optional(v.string()),
    model: v.optional(v.string()),
    year: v.optional(v.number()),
    color: v.optional(v.string()),
    notes: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const { sessionToken: _sessionToken, ...payload } = args;
    return await ctx.db.insert("vehicles", payload);
  },
});

export const updateVehicle = mutation({
  args: {
    sessionToken: v.string(),
    vehicleId: v.id("vehicles"),
    name: v.optional(v.string()),
    plate: v.optional(v.string()),
    brand: v.optional(v.string()),
    model: v.optional(v.string()),
    year: v.optional(v.number()),
    color: v.optional(v.string()),
    notes: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getVehicleWithAccessOrThrow(ctx, args.sessionToken, args.vehicleId);
    const { vehicleId, sessionToken: _sessionToken, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(vehicleId, filteredUpdates);
    return vehicleId;
  },
});

export const deleteVehicle = mutation({
  args: { sessionToken: v.string(), vehicleId: v.id("vehicles") },
  handler: async (ctx, args) => {
    await getVehicleWithAccessOrThrow(ctx, args.sessionToken, args.vehicleId);
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
    type: v.union(
      v.literal("verification"),
      v.literal("service"),
      v.literal("insurance"),
      v.literal("fuel"),
      v.literal("repair"),
      v.literal("other")
    ),
    title: v.string(),
    date: v.number(),
    nextDate: v.optional(v.number()), // For reminders
    odometer: v.optional(v.number()), // Kilometraje
    amount: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserFromSessionToken(ctx, args.sessionToken);
    const vehicle = await getVehicleWithAccessOrThrow(ctx, args.sessionToken, args.vehicleId);
    const { sessionToken: _sessionToken, ...eventData } = args;
    
    // Create the vehicle event (including amount)
    const eventId = await ctx.db.insert("vehicleEvents", eventData);
    
    // If there's an amount, also create an expense
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
    type: v.optional(
      v.union(
        v.literal("verification"),
        v.literal("service"),
        v.literal("insurance"),
        v.literal("fuel"),
        v.literal("repair"),
        v.literal("other")
      )
    ),
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
    // Also delete related expense
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

// ==================== SUMMARY ====================
export const getVehiclesSummary = query({
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const vehicles = await ctx.db
      .query("vehicles")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();

    // Get upcoming vehicle events (next 30 days based on nextDate)
    const now = Date.now();
    const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;

    const upcomingEvents: Array<{
      vehicleId: string;
      vehicleName: string;
      event: { type: string; title: string; date: number };
    }> = [];

    for (const vehicle of vehicles) {
      const events = await ctx.db
        .query("vehicleEvents")
        .withIndex("by_vehicle", (q) => q.eq("vehicleId", vehicle._id))
        .collect();

      for (const event of events) {
        // Check nextDate for upcoming reminders
        if (event.nextDate && event.nextDate >= now && event.nextDate <= thirtyDaysFromNow) {
          upcomingEvents.push({
            vehicleId: vehicle._id,
            vehicleName: vehicle.name,
            event: { type: event.type, title: event.title, date: event.nextDate },
          });
        }
      }
    }

    upcomingEvents.sort((a, b) => a.event.date - b.event.date);

    // Get total spent on vehicles this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const vehicleExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_family_type", (q) => 
        q.eq("familyId", args.familyId).eq("type", "vehicle")
      )
      .collect();

    const thisMonthExpenses = vehicleExpenses.filter(e => e.date >= startOfMonth.getTime());
    const totalThisMonth = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      vehicleCount: vehicles.length,
      upcomingEvents: upcomingEvents.slice(0, 5),
      totalSpentThisMonth: totalThisMonth,
    };
  },
});
