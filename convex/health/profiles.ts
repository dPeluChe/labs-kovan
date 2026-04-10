import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireFamilyAccessFromSession } from "../lib/auth";
import { getPersonWithAccessOrThrow } from "./access";

export const getPersonProfiles = query({
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    return await ctx.db
      .query("personProfiles")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();
  },
});

export const getPersonProfile = query({
  args: { sessionToken: v.string(), personId: v.id("personProfiles") },
  handler: async (ctx, args) => {
    return await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
  },
});

export const createPersonProfile = mutation({
  args: {
    sessionToken: v.string(),
    familyId: v.id("families"),
    type: v.union(v.literal("human"), v.literal("pet")),
    name: v.string(),
    relation: v.string(),
    nickname: v.optional(v.string()),
    birthDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const { sessionToken: _sessionToken, ...payload } = args;
    return await ctx.db.insert("personProfiles", payload);
  },
});

export const updatePersonProfile = mutation({
  args: {
    sessionToken: v.string(),
    personId: v.id("personProfiles"),
    name: v.optional(v.string()),
    relation: v.optional(v.string()),
    nickname: v.optional(v.string()),
    birthDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
    const { personId, sessionToken: _sessionToken, ...updates } = args;
    await ctx.db.patch(personId, updates);
    return personId;
  },
});

export const deletePersonProfile = mutation({
  args: { sessionToken: v.string(), personId: v.id("personProfiles") },
  handler: async (ctx, args) => {
    await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
    const records = await ctx.db
      .query("medicalRecords")
      .withIndex("by_person", (q) => q.eq("personId", args.personId))
      .collect();
    for (const record of records) {
      await ctx.db.delete(record._id);
    }

    const meds = await ctx.db
      .query("medications")
      .withIndex("by_person", (q) => q.eq("personId", args.personId))
      .collect();
    for (const med of meds) {
      await ctx.db.delete(med._id);
    }

    await ctx.db.delete(args.personId);
  },
});
