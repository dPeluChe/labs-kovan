import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

const CATEGORY_TYPE = v.union(
  v.literal("restaurant"),
  v.literal("cafe"),
  v.literal("travel"),
  v.literal("activity"),
  v.literal("other")
);

export const getPlaces = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("places")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();
  },
});

export const getPlace = query({
  args: { placeId: v.id("places") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.placeId);
  },
});

export const createPlace = mutation({
  args: {
    familyId: v.id("families"),
    name: v.string(),
    url: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    address: v.optional(v.string()),
    category: CATEGORY_TYPE,
    notes: v.optional(v.string()),
    addedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("places", {
      ...args,
      visited: false,
    });
  },
});

export const updatePlace = mutation({
  args: {
    placeId: v.id("places"),
    name: v.optional(v.string()),
    url: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    address: v.optional(v.string()),
    category: v.optional(CATEGORY_TYPE),
    visited: v.optional(v.boolean()),
    rating: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { placeId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    return await ctx.db.patch(placeId, filteredUpdates);
  },
});

export const toggleVisited = mutation({
  args: { placeId: v.id("places") },
  handler: async (ctx, args) => {
    const place = await ctx.db.get(args.placeId);
    if (!place) throw new Error("Place not found");
    return await ctx.db.patch(args.placeId, {
      visited: !place.visited,
    });
  },
});

export const deletePlace = mutation({
  args: { placeId: v.id("places") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.placeId);
  },
});

export const getPlaceSummary = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
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
