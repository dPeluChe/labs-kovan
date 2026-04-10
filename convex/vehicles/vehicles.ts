import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireFamilyAccessFromSession } from "../lib/auth";
import { getVehicleWithAccessOrThrow } from "./access";

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
