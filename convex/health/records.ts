import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getPersonWithAccessOrThrow, getRecordWithAccessOrThrow } from "./access";

export const getMedicalRecords = query({
  args: { sessionToken: v.string(), personId: v.id("personProfiles") },
  handler: async (ctx, args) => {
    await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
    return await ctx.db
      .query("medicalRecords")
      .withIndex("by_person", (q) => q.eq("personId", args.personId))
      .collect();
  },
});

export const createMedicalRecord = mutation({
  args: {
    sessionToken: v.string(),
    personId: v.id("personProfiles"),
    type: v.union(
      v.literal("consultation"),
      v.literal("study"),
      v.literal("note")
    ),
    title: v.string(),
    description: v.optional(v.string()),
    date: v.number(),
    doctorName: v.optional(v.string()),
    clinicName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
    const { sessionToken: _sessionToken, ...payload } = args;
    return await ctx.db.insert("medicalRecords", payload);
  },
});

export const updateMedicalRecord = mutation({
  args: {
    sessionToken: v.string(),
    recordId: v.id("medicalRecords"),
    type: v.optional(
      v.union(
        v.literal("consultation"),
        v.literal("study"),
        v.literal("note")
      )
    ),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
    doctorName: v.optional(v.string()),
    clinicName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getRecordWithAccessOrThrow(ctx, args.sessionToken, args.recordId);
    const { recordId, sessionToken: _sessionToken, ...updates } = args;
    await ctx.db.patch(recordId, updates);
    return recordId;
  },
});

export const deleteMedicalRecord = mutation({
  args: { sessionToken: v.string(), recordId: v.id("medicalRecords") },
  handler: async (ctx, args) => {
    await getRecordWithAccessOrThrow(ctx, args.sessionToken, args.recordId);
    await ctx.db.delete(args.recordId);
  },
});
