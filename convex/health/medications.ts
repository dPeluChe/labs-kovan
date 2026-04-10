import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getMedicationWithAccessOrThrow, getPersonWithAccessOrThrow } from "./access";

export const getMedications = query({
  args: { sessionToken: v.string(), personId: v.id("personProfiles") },
  handler: async (ctx, args) => {
    await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
    return await ctx.db
      .query("medications")
      .withIndex("by_person", (q) => q.eq("personId", args.personId))
      .collect();
  },
});

export const getActiveMedications = query({
  args: { sessionToken: v.string(), personId: v.id("personProfiles") },
  handler: async (ctx, args) => {
    await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
    const now = Date.now();
    const meds = await ctx.db
      .query("medications")
      .withIndex("by_person", (q) => q.eq("personId", args.personId))
      .collect();

    return meds.filter((med) => {
      const isActiveStatus = med.status === "active" || !med.status;
      const dateValid = !med.endDate || med.endDate > now;
      return isActiveStatus && dateValid;
    });
  },
});

export const createMedication = mutation({
  args: {
    sessionToken: v.string(),
    personId: v.id("personProfiles"),
    name: v.string(),
    dosage: v.string(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("completed"), v.literal("paused"))),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
    const { sessionToken: _sessionToken, ...payload } = args;
    return await ctx.db.insert("medications", {
      ...payload,
      status: payload.status || "active",
    });
  },
});

export const updateMedication = mutation({
  args: {
    sessionToken: v.string(),
    medicationId: v.id("medications"),
    name: v.optional(v.string()),
    dosage: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("completed"), v.literal("paused"))),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getMedicationWithAccessOrThrow(ctx, args.sessionToken, args.medicationId);
    const { medicationId, sessionToken: _sessionToken, ...updates } = args;
    await ctx.db.patch(medicationId, updates);
    return medicationId;
  },
});

export const deleteMedication = mutation({
  args: { sessionToken: v.string(), medicationId: v.id("medications") },
  handler: async (ctx, args) => {
    await getMedicationWithAccessOrThrow(ctx, args.sessionToken, args.medicationId);
    await ctx.db.delete(args.medicationId);
  },
});

export const getAllMedications = query({
  args: { sessionToken: v.string(), personId: v.id("personProfiles") },
  handler: async (ctx, args) => {
    await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
    const meds = await ctx.db
      .query("medications")
      .withIndex("by_person", (q) => q.eq("personId", args.personId))
      .collect();

    const now = Date.now();
    return meds.map((med) => {
      const isActiveStatus = med.status === "active" || !med.status;
      const dateValid = !med.endDate || med.endDate > now;
      return {
        ...med,
        status: med.status || (dateValid ? "active" : "completed"),
        isActive: isActiveStatus && dateValid,
      };
    });
  },
});
