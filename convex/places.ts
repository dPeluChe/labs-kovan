import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Reusable shapes
const PLACE_CATEGORY = v.union(
  v.literal("restaurant"),
  v.literal("cafe"),
  v.literal("travel"),
  v.literal("activity"),
  v.literal("other")
);

// ==================== LISTS ====================

export const getLists = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("placeLists")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();
  },
});

export const createList = mutation({
  args: {
    familyId: v.id("families"),
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("placeLists", args);
  },
});

export const updateList = mutation({
  args: {
    listId: v.id("placeLists"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { listId, ...updates } = args;
    await ctx.db.patch(listId, updates);
  },
});

export const deleteList = mutation({
  args: { listId: v.id("placeLists") },
  handler: async (ctx, args) => {
    // Check if there are places in this list?
    // Option 1: Prevent delete
    // Option 2: Unlink places (set listId to null) - Prefer checking first
    const placesInList = await ctx.db
      .query("places")
      .withIndex("by_list", (q) => q.eq("listId", args.listId))
      .collect();

    if (placesInList.length > 0) {
      // Unlink them or burn them? Let's unlink them for safety
      for (const place of placesInList) {
        await ctx.db.patch(place._id, { listId: undefined });
      }
    }
    await ctx.db.delete(args.listId);
  },
});

// ==================== PLACES ====================

export const getPlaces = query({
  args: {
    familyId: v.id("families"),
    listId: v.optional(v.id("placeLists")) // Optional filtering
  },
  handler: async (ctx, args) => {
    if (args.listId) {
      return await ctx.db
        .query("places")
        .withIndex("by_list", (q) => q.eq("listId", args.listId))
        .collect();
    }
    // Return all for the family
    // Note: by_list index is not useful for querying by family directly unless we scan.
    // Better to use by_family index.
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    return await ctx.db.insert("places", {
      ...args,
      addedBy: user._id,
      visited: args.visited ?? false,
    });
  },
});

export const updatePlace = mutation({
  args: {
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
    const { placeId, ...updates } = args;
    await ctx.db.patch(placeId, updates);
  },
});

export const deletePlace = mutation({
  args: { placeId: v.id("places") },
  handler: async (ctx, args) => {
    // Delete visits too? Yes
    const visits = await ctx.db
      .query("placeVisits")
      .withIndex("by_place", (q) => q.eq("placeId", args.placeId))
      .collect();

    for (const visit of visits) {
      await ctx.db.delete(visit._id);
    }

    return await ctx.db.delete(args.placeId);
  },
});

// ==================== VISITS ====================

export const getPlaceVisits = query({
  args: { placeId: v.id("places") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("placeVisits")
      .withIndex("by_place", (q) => q.eq("placeId", args.placeId))
      .order("desc") // Most recent first (if date is indexed? currently no range index on date but default is creation time usually, actually we sorting by creation if not specified, but visitDate isn't the sort key here. We might need logic or an index on date)
      // Ideally .index("by_place", ["placeId", "visitDate"]) if we want sorted DB side. 
      // For now, client side sort or simple.
      .collect();
  }
});

export const recordVisit = mutation({
  args: {
    placeId: v.id("places"),
    familyId: v.id("families"),
    visitDate: v.number(),
    rating: v.optional(v.number()),
    notes: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    visitType: v.optional(v.string()),
    // visitedBy fetched from auth
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    // Create visit record
    const visitId = await ctx.db.insert("placeVisits", {
      ...args,
      visitedBy: user._id,
    });

    // Update place "visited" status and "rating" (maybe average?)
    // For simplicity now, we just mark as visited.
    await ctx.db.patch(args.placeId, {
      visited: true,
      rating: args.rating, // Update latest rating preference
    });

    return visitId;
  }
});

export const deleteVisit = mutation({
  args: { visitId: v.id("placeVisits") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.visitId);
  }
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
