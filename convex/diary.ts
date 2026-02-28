import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireFamilyAccessFromSession, requireUserFromSessionToken } from "./lib/auth";

export const getEntries = query({
    args: {
        sessionToken: v.string(),
        familyId: v.id("families"),
    },
    handler: async (ctx, args) => {
        const { user } = await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
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
            if (entry.visibility === "private" && entry.userId === user._id) return true;
            return false;
        });
    },
});

export const createEntry = mutation({
    args: {
        sessionToken: v.string(),
        familyId: v.id("families"),
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
        const { user } = await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
        const entryId = await ctx.db.insert("diaryEntries", {
            familyId: args.familyId,
            userId: user._id,
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
        sessionToken: v.string(),
        entryId: v.id("diaryEntries"),
    },
    handler: async (ctx, args) => {
        const user = await requireUserFromSessionToken(ctx, args.sessionToken);
        const entry = await ctx.db.get(args.entryId);
        if (!entry) throw new Error("Entry not found");

        // Only author can delete their diary entry
        if (entry.userId !== user._id) throw new Error("Unauthorized: Only the author can delete this entry");

        await ctx.db.delete(args.entryId);
    }
});

export const updateEntry = mutation({
    args: {
        sessionToken: v.string(),
        entryId: v.id("diaryEntries"),
        content: v.optional(v.string()),
        mood: v.optional(v.string()),
        moodEmoji: v.optional(v.string()),
        moodLabel: v.optional(v.string()),
        visibility: v.optional(v.union(v.literal("private"), v.literal("family"))),
        date: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await requireUserFromSessionToken(ctx, args.sessionToken);
        const entry = await ctx.db.get(args.entryId);
        if (!entry) throw new Error("Entry not found");

        // Only author can edit their diary entry
        if (entry.userId !== user._id) throw new Error("Unauthorized: Only the author can edit this entry");

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
