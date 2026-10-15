import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { requireFamilyAccessFromSession, requireUserFromSessionToken } from "../lib/auth";

export const getPlaceVisits = query({
  args: { sessionToken: v.string(), placeId: v.id("places") },
  handler: async (ctx, args) => {
    const place = await ctx.db.get(args.placeId);
    if (!place) return [];
    await requireFamilyAccessFromSession(ctx, args.sessionToken, place.familyId);
    return await ctx.db
      .query("placeVisits")
      .withIndex("by_place", (q) => q.eq("placeId", args.placeId))
      .order("desc")
      .collect();
  }
});

export const getAllVisits = query({
  args: { sessionToken: v.string(), familyId: v.id("families"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const visits = await ctx.db
      .query("placeVisits")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .order("desc")
      .take(args.limit || 50);

    // Join with place names, fetching each place once
    const placeIds = [...new Set(visits.map((visit) => visit.placeId))];
    const places = await Promise.all(placeIds.map((id) => ctx.db.get(id)));
    const placesById = new Map(placeIds.map((id, i) => [id, places[i]] as const));

    return visits.map((visit) => {
      const place = placesById.get(visit.placeId);
      return {
        ...visit,
        placeName: place?.name || "Lugar eliminado",
        placeImage: place?.imageUrl,
      };
    });
  }
});

export const recordVisit = mutation({
  args: {
    sessionToken: v.string(),
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
    const user = await requireUserFromSessionToken(ctx, args.sessionToken);
    const place = await ctx.db.get(args.placeId);
    if (!place) throw new Error("Lugar no encontrado");
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    if (place.familyId !== args.familyId) {
      throw new Error("El lugar no pertenece a esta familia");
    }

    // Create visit record
    const { sessionToken: _sessionToken, ...visitPayload } = args;
    const visitId = await ctx.db.insert("placeVisits", {
      ...visitPayload,
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
  args: { sessionToken: v.string(), visitId: v.id("placeVisits") },
  handler: async (ctx, args) => {
    const visit = await ctx.db.get(args.visitId);
    if (!visit) return null;
    await requireFamilyAccessFromSession(ctx, args.sessionToken, visit.familyId);
    await ctx.db.delete(args.visitId);
  }
});
