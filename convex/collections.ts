import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==================== QUERIES ====================

export const getCollections = query({
    args: { familyId: v.id("families") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("collections")
            .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
            .collect();
    },
});

export const getCollectionsBySeries = query({
    args: {
        familyId: v.id("families"),
        series: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("collections")
            .withIndex("by_series", (q) =>
                q.eq("familyId", args.familyId).eq("series", args.series)
            )
            .collect();
    },
});

export const getCollectionSummary = query({
    args: { familyId: v.id("families") },
    handler: async (ctx, args) => {
        const items = await ctx.db
            .query("collections")
            .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
            .collect();

        const byType: Record<string, number> = {};
        const byStatus: Record<string, number> = {};
        let owned = 0;
        let wishlist = 0;

        for (const item of items) {
            // Count by Type
            byType[item.type] = (byType[item.type] || 0) + 1;

            // Count by Status
            byStatus[item.status] = (byStatus[item.status] || 0) + 1;

            if (item.owned) owned++;
            else wishlist++;
        }

        // Identify incomplete series (simple logic: existing series with missing items logic is harder without numeric volumes)
        // We will just return the stats for now.

        // Group by series to count
        const seriesStats = new Map<string, { total: number; owned: number }>();
        for (const item of items) {
            if (item.series) {
                const existing = seriesStats.get(item.series) || { total: 0, owned: 0 };
                existing.total++;
                if (item.owned) existing.owned++;
                seriesStats.set(item.series, existing);
            }
        }

        const seriesList = Array.from(seriesStats.entries()).map(([name, stats]) => ({
            name,
            ...stats,
        }));

        return {
            total: items.length,
            byType,
            byStatus,
            owned,
            wishlist,
            seriesStats: seriesList.sort((a, b) => b.total - a.total).slice(0, 5),
        };
    },
});

// ==================== MUTATIONS ====================

export const createItem = mutation({
    args: {
        familyId: v.id("families"),
        type: v.union(
            v.literal("book"),
            v.literal("manga"),
            v.literal("comic"),
            v.literal("board_game"),
            v.literal("video_game"),
            v.literal("collectible"),
            v.literal("other")
        ),
        title: v.string(),
        creator: v.optional(v.string()),
        series: v.optional(v.string()),
        volumeOrVersion: v.optional(v.string()),
        owned: v.boolean(),
        status: v.union(
            v.literal("wishlist"),
            v.literal("owned_unread"),
            v.literal("in_progress"),
            v.literal("finished"),
            v.literal("abandoned")
        ),
        location: v.optional(v.string()),
        rating: v.optional(v.number()),
        notes: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        imageStorageId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        const userId = (await ctx.auth.getUserIdentity())?.subject;
        if (!userId) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", userId))
            .unique();

        if (!user) throw new Error("User not found");

        return await ctx.db.insert("collections", {
            ...args,
            addedBy: user._id,
        });
    },
});

export const updateItem = mutation({
    args: {
        itemId: v.id("collections"),
        title: v.optional(v.string()),
        creator: v.optional(v.string()),
        series: v.optional(v.string()),
        volumeOrVersion: v.optional(v.string()),
        owned: v.optional(v.boolean()),
        status: v.optional(
            v.union(
                v.literal("wishlist"),
                v.literal("owned_unread"),
                v.literal("in_progress"),
                v.literal("finished"),
                v.literal("abandoned")
            )
        ),
        location: v.optional(v.string()),
        rating: v.optional(v.number()),
        notes: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        imageStorageId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        const { itemId, ...updates } = args;
        await ctx.db.patch(itemId, updates);
    },
});

export const deleteItem = mutation({
    args: { itemId: v.id("collections") },
    handler: async (ctx, args) => {
        // Optionally delete image from storage if needed
        // const item = await ctx.db.get(args.itemId);
        // if (item?.imageStorageId) await ctx.storage.delete(item.imageStorageId);

        await ctx.db.delete(args.itemId);
    },
});
