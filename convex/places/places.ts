import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { requireFamilyAccessFromSession } from "../lib/auth";
import { PLACE_CATEGORY } from "./types";

export const getPlaces = query({
  args: {
    sessionToken: v.string(),
    familyId: v.id("families"),
    listId: v.optional(v.id("placeLists")), // Optional filtering
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const limit = args.limit ?? 200;
    if (args.listId) {
      const list = await ctx.db.get(args.listId);
      if (!list || list.familyId !== args.familyId) {
        throw new Error("Lista inválida para esta familia");
      }
      return await ctx.db
        .query("places")
        .withIndex("by_list", (q) => q.eq("listId", args.listId))
        .take(limit);
    }
    // Return all for the family
    // Note: by_list index is not useful for querying by family directly unless we scan.
    // Better to use by_family index.
    return await ctx.db
      .query("places")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .take(limit);
  },
});

export const getPlace = query({
  args: { sessionToken: v.string(), placeId: v.id("places") },
  handler: async (ctx, args) => {
    const place = await ctx.db.get(args.placeId);
    if (!place) return null;
    await requireFamilyAccessFromSession(ctx, args.sessionToken, place.familyId);
    return place;
  },
});

export const createPlace = mutation({
  args: {
    sessionToken: v.string(),
    familyId: v.id("families"),
    listId: v.optional(v.id("placeLists")),
    name: v.string(),
    url: v.optional(v.string()),
    mapsUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    address: v.optional(v.string()),
    highlight: v.optional(v.string()),
    category: PLACE_CATEGORY,
    notes: v.optional(v.string()),
    // addedBy fetched from auth
    visited: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const { sessionToken: _sessionToken, ...payload } = args;

    return await ctx.db.insert("places", {
      ...payload,
      addedBy: user._id,
      visited: args.visited ?? false,
    });
  },
});

export const updatePlace = mutation({
  args: {
    sessionToken: v.string(),
    placeId: v.id("places"),
    listId: v.optional(v.id("placeLists")),
    name: v.optional(v.string()),
    url: v.optional(v.string()),
    mapsUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    address: v.optional(v.string()),
    highlight: v.optional(v.string()),
    category: v.optional(PLACE_CATEGORY),
    visited: v.optional(v.boolean()),
    rating: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const place = await ctx.db.get(args.placeId);
    if (!place) throw new Error("Lugar no encontrado");
    await requireFamilyAccessFromSession(ctx, args.sessionToken, place.familyId);
    const { placeId, sessionToken: _sessionToken, ...updates } = args;
    await ctx.db.patch(placeId, updates);
  },
});

export const deletePlace = mutation({
  args: { sessionToken: v.string(), placeId: v.id("places") },
  handler: async (ctx, args) => {
    const place = await ctx.db.get(args.placeId);
    if (!place) return null;
    await requireFamilyAccessFromSession(ctx, args.sessionToken, place.familyId);
    // Delete visits too? Yes
    const visits = await ctx.db
      .query("placeVisits")
      .withIndex("by_place", (q) => q.eq("placeId", args.placeId))
      .collect();

    await Promise.all(visits.map((visit) => ctx.db.delete(visit._id)));

    return await ctx.db.delete(args.placeId);
  },
});

export const getPlaceSummary = query({
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const places = await ctx.db
      .query("places")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();

    return {
      total: places.length,
      visited: places.filter((p) => p.visited).length,
      pending: places.filter((p) => !p.visited).length,
    };
  },
});
