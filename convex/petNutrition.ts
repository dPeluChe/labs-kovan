
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getNutritionHistory = query({
    args: { personId: v.id("personProfiles") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("petNutrition")
            .withIndex("by_person_date", (q) => q.eq("personId", args.personId))
            .order("desc") // Most recent first
            .collect();
    },
});

export const getLastPurchase = query({
    args: { personId: v.id("personProfiles") },
    handler: async (ctx, args) => {
        const record = await ctx.db
            .query("petNutrition")
            .withIndex("by_person_date", (q) => q.eq("personId", args.personId))
            .order("desc")
            .first();
        return record;
    },
});

export const createNutritionRecord = mutation({
    args: {
        personId: v.id("personProfiles"),
        brand: v.string(),
        productName: v.optional(v.string()),
        type: v.union(v.literal("food"), v.literal("treats"), v.literal("supplement"), v.literal("other")),
        amount: v.optional(v.number()),
        weight: v.optional(v.string()),
        purchaseDate: v.number(),
        store: v.optional(v.string()),
        notes: v.optional(v.string()),
        addedBy: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("petNutrition", args);
    },
});

export const updateNutritionRecord = mutation({
    args: {
        id: v.id("petNutrition"),
        brand: v.optional(v.string()),
        productName: v.optional(v.string()),
        type: v.optional(v.union(v.literal("food"), v.literal("treats"), v.literal("supplement"), v.literal("other"))),
        amount: v.optional(v.number()),
        weight: v.optional(v.string()),
        purchaseDate: v.optional(v.number()),
        store: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
        return id;
    },
});

export const deleteNutritionRecord = mutation({
    args: { id: v.id("petNutrition") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
