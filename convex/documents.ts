import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ==================== DOCUMENTS ====================

export const list = query({
    args: {
        familyId: v.id("families"),
        personId: v.optional(v.id("personProfiles")),
    },
    handler: async (ctx, args) => {
        const q = ctx.db
            .query("documents")
            .withIndex("by_family", (q) => q.eq("familyId", args.familyId));

        let docs = await q.collect();

        // Filter by person if provided, otherwise return all (or specific logic)
        // Dashboard might want "All for family". 
        // Details view might want "All for Sofia".
        if (args.personId) {
            docs = docs.filter((d) => d.personId === args.personId);
        }

        // Sort: Active expirations first (soonest first), then others
        return docs.sort((a, b) => {
            // Archived at bottom
            if (a.isArchived !== b.isArchived) return a.isArchived ? 1 : -1;

            // With expiry: sort by soonest
            const aExp = a.expiryDate;
            const bExp = b.expiryDate;

            if (aExp && bExp) return aExp - bExp;
            if (aExp) return -1; // Has expiry > No expiry
            if (bExp) return 1;

            return 0;
        });
    },
});

export const getDocument = query({
    args: { documentId: v.id("documents") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.documentId);
    },
});

export const create = mutation({
    args: {
        familyId: v.id("families"),
        userId: v.id("users"), // AddedBy
        personId: v.optional(v.id("personProfiles")),
        title: v.string(),
        type: v.union(
            v.literal("identity"),
            v.literal("travel"),
            v.literal("financial"),
            v.literal("insurance"),
            v.literal("education"),
            v.literal("health"),
            v.literal("other")
        ),
        documentNumber: v.optional(v.string()),
        issuingAuthority: v.optional(v.string()),
        expiryDate: v.optional(v.number()),
        issueDate: v.optional(v.number()),
        notes: v.optional(v.string()),
        files: v.optional(v.array(v.string())),
        storageIds: v.optional(v.array(v.id("_storage"))),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("documents", {
            familyId: args.familyId,
            personId: args.personId,
            title: args.title,
            type: args.type,
            documentNumber: args.documentNumber,
            issuingAuthority: args.issuingAuthority,
            expiryDate: args.expiryDate,
            issueDate: args.issueDate,
            notes: args.notes,
            files: args.files,
            storageIds: args.storageIds,
            isArchived: false,
            addedBy: args.userId,
        });
    },
});

export const update = mutation({
    args: {
        documentId: v.id("documents"),
        familyId: v.id("families"), // Auth check
        personId: v.optional(v.id("personProfiles")),
        title: v.optional(v.string()),
        type: v.optional(v.union(
            v.literal("identity"),
            v.literal("travel"),
            v.literal("financial"),
            v.literal("insurance"),
            v.literal("education"),
            v.literal("health"),
            v.literal("other")
        )),
        documentNumber: v.optional(v.string()),
        issuingAuthority: v.optional(v.string()),
        expiryDate: v.optional(v.number()),
        issueDate: v.optional(v.number()),
        notes: v.optional(v.string()),
        files: v.optional(v.array(v.string())),
        storageIds: v.optional(v.array(v.id("_storage"))),
        isArchived: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { documentId, familyId, ...updates } = args;
        const doc = await ctx.db.get(documentId);
        if (!doc) throw new Error("Document not found");
        if (doc.familyId !== familyId) throw new Error("Unauthorized");

        await ctx.db.patch(documentId, updates);
    },
});

export const deleteDocument = mutation({
    args: {
        documentId: v.id("documents"),
        familyId: v.id("families"),
    },
    handler: async (ctx, args) => {
        const doc = await ctx.db.get(args.documentId);
        if (!doc) throw new Error("Document not found");
        if (doc.familyId !== args.familyId) throw new Error("Unauthorized");

        // Optional: Clean up storage?
        // if (doc.storageIds) { ... } logic handled usually by cron or keeping files.

        await ctx.db.delete(args.documentId);
    },
});
