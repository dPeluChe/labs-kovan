import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getPersonWithAccessOrThrow, getStudyWithAccessOrThrow } from "./access";

export const getStudies = query({
  args: { sessionToken: v.string(), personId: v.id("personProfiles") },
  handler: async (ctx, args) => {
    await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
    return await ctx.db
      .query("medicalStudies")
      .withIndex("by_person", (q) => q.eq("personId", args.personId))
      .collect();
  },
});

export const createStudy = mutation({
  args: {
    sessionToken: v.string(),
    personId: v.id("personProfiles"),
    title: v.string(),
    date: v.number(),
    laboratory: v.optional(v.string()),
    doctorName: v.optional(v.string()),
    results: v.array(v.object({
      parameter: v.string(),
      value: v.string(),
      unit: v.optional(v.string()),
      reference: v.optional(v.string()),
      status: v.optional(v.union(v.literal("normal"), v.literal("high"), v.literal("low"))),
    })),
    notes: v.optional(v.string()),
    fileStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
    const { sessionToken: _sessionToken, ...payload } = args;
    return await ctx.db.insert("medicalStudies", payload);
  },
});

export const deleteStudy = mutation({
  args: { sessionToken: v.string(), studyId: v.id("medicalStudies") },
  handler: async (ctx, args) => {
    await getStudyWithAccessOrThrow(ctx, args.sessionToken, args.studyId);
    return await ctx.db.delete(args.studyId);
  },
});
