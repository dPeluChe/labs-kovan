import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getEntries = query({
    args: {
        familyId: v.id("families"),
        userId: v.optional(v.id("users")), // Pass userId to see private entries
    },
    handler: async (ctx, args) => {
        // Fetch all entries for the family
        const allEntries = await ctx.db
            .query("diaryEntries")
            .withIndex("by_family_date", (q) => q.eq("familyId", args.familyId))
            .order("desc") // Newest first
            .collect();

        // Filter based on visibility
        return allEntries.filter(entry => {
            // Family entries are visible to everyone in the family
            if (entry.visibility === "family") return true;
            // Private entries only visible if you are the author
            if (entry.visibility === "private" && args.userId && entry.userId === args.userId) return true;
            return false;
        });
    },
});

export const createEntry = mutation({
    args: {
        familyId: v.id("families"),
        userId: v.id("users"), // Explicitly pass user ID
        content: v.optional(v.string()),
        mood: v.optional(v.string()),
        moodEmoji: v.optional(v.string()),
        moodLabel: v.optional(v.string()),
        visibility: v.union(v.literal("private"), v.literal("family")),
        images: v.optional(v.array(v.string())),
        imageStorageIds: v.optional(v.array(v.id("_storage"))),
        date: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const entryId = await ctx.db.insert("diaryEntries", {
            familyId: args.familyId,
            userId: args.userId,
            content: args.content,
            mood: args.mood,
            moodEmoji: args.moodEmoji,
            moodLabel: args.moodLabel,
            visibility: args.visibility,
            date: args.date || Date.now(),
            images: args.images,
            imageStorageIds: args.imageStorageIds,
        });

        return entryId;
    },
});

export const deleteEntry = mutation({
    args: {
        entryId: v.id("diaryEntries"),
        userId: v.id("users"), // Explicitly pass user ID for auth check
    },
    handler: async (ctx, args) => {
        const entry = await ctx.db.get(args.entryId);
        if (!entry) throw new Error("Entry not found");

        // Only author can delete their diary entry
        if (entry.userId !== args.userId) throw new Error("Unauthorized: Only the author can delete this entry");

        await ctx.db.delete(args.entryId);
    }
});

export const updateEntry = mutation({
    args: {
        entryId: v.id("diaryEntries"),
        userId: v.id("users"), // Explicitly pass user ID for auth check
        content: v.optional(v.string()),
        mood: v.optional(v.string()),
        moodEmoji: v.optional(v.string()),
        moodLabel: v.optional(v.string()),
        visibility: v.optional(v.union(v.literal("private"), v.literal("family"))),
        date: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const entry = await ctx.db.get(args.entryId);
        if (!entry) throw new Error("Entry not found");

        // Only author can edit their diary entry
        if (entry.userId !== args.userId) throw new Error("Unauthorized: Only the author can edit this entry");

        await ctx.db.patch(args.entryId, {
            content: args.content !== undefined ? args.content : entry.content,
            mood: args.mood !== undefined ? args.mood : entry.mood,
            moodEmoji: args.moodEmoji !== undefined ? args.moodEmoji : entry.moodEmoji,
            moodLabel: args.moodLabel !== undefined ? args.moodLabel : entry.moodLabel,
            visibility: args.visibility !== undefined ? args.visibility : entry.visibility,
            date: args.date !== undefined ? args.date : entry.date,
        });
    }
});
