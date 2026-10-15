import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { requireFamilyAccessFromSession } from "../lib/auth";

export const getLists = query({
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    // Fetch counts for each list
    // Note: N+1 query pattern, but safe for small number of lists (<20).
    // An alternative is fetching all places for family and aggregating in memory.
    // Let's do aggregation for efficiency if lists grow.
    const [lists, allPlaces] = await Promise.all([
      ctx.db
        .query("placeLists")
        .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
        .take(100),
      ctx.db
        .query("places")
        .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
        .collect(),
    ]);

    // Map counts
    const counts = allPlaces.reduce((acc, place) => {
      if (place.listId) {
        acc[place.listId] = (acc[place.listId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return lists.map(list => ({
      ...list,
      count: counts[list._id] || 0
    }));
  },
});

export const createList = mutation({
  args: {
    sessionToken: v.string(),
    familyId: v.id("families"),
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const { sessionToken: _sessionToken, ...payload } = args;
    return await ctx.db.insert("placeLists", payload);
  },
});

export const updateList = mutation({
  args: {
    sessionToken: v.string(),
    listId: v.id("placeLists"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db.get(args.listId);
    if (!list) throw new Error("Lista no encontrada");
    await requireFamilyAccessFromSession(ctx, args.sessionToken, list.familyId);
    const { listId, sessionToken: _sessionToken, ...updates } = args;
    await ctx.db.patch(listId, updates);
  },
});

export const deleteList = mutation({
  args: { sessionToken: v.string(), listId: v.id("placeLists") },
  handler: async (ctx, args) => {
    const list = await ctx.db.get(args.listId);
    if (!list) return;
    await requireFamilyAccessFromSession(ctx, args.sessionToken, list.familyId);
    // Check if there are places in this list?
    // Option 1: Prevent delete
    // Option 2: Unlink places (set listId to null) - Prefer checking first
    const placesInList = await ctx.db
      .query("places")
      .withIndex("by_list", (q) => q.eq("listId", args.listId))
      .collect();

    if (placesInList.length > 0) {
      // Unlink them or burn them? Let's unlink them for safety
      await Promise.all(placesInList.map((place) => ctx.db.patch(place._id, { listId: undefined })));
    }
    await ctx.db.delete(args.listId);
  },
});
