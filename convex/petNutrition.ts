
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireFamilyAccessFromSession, requireUserFromSessionToken } from "./lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getPersonWithAccessOrThrow(ctx: any, sessionToken: string, personId: any) {
    const person = await ctx.db.get(personId);
    if (!person) throw new Error("Perfil no encontrado");
    await requireFamilyAccessFromSession(ctx, sessionToken, person.familyId);
    return person;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getRecordWithAccessOrThrow(ctx: any, sessionToken: string, id: any) {
    const record = await ctx.db.get(id);
    if (!record) throw new Error("Registro no encontrado");
    await getPersonWithAccessOrThrow(ctx, sessionToken, record.personId);
    return record;
}

export const getNutritionHistory = query({
    args: { sessionToken: v.string(), personId: v.id("personProfiles") },
    handler: async (ctx, args) => {
        await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
        return await ctx.db
            .query("petNutrition")
            .withIndex("by_person_date", (q) => q.eq("personId", args.personId))
            .order("desc") // Most recent first
            .collect();
    },
});

export const getLastPurchase = query({
    args: { sessionToken: v.string(), personId: v.id("personProfiles") },
    handler: async (ctx, args) => {
        await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
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
        sessionToken: v.string(),
        personId: v.id("personProfiles"),
        brand: v.string(),
        productName: v.optional(v.string()),
        type: v.union(v.literal("food"), v.literal("treats"), v.literal("supplement"), v.literal("other")),
        amount: v.optional(v.number()),
        weight: v.optional(v.string()),
        purchaseDate: v.number(),
        store: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireUserFromSessionToken(ctx, args.sessionToken);
        await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
        const { sessionToken: _sessionToken, ...payload } = args;
        return await ctx.db.insert("petNutrition", {
            ...payload,
            addedBy: user._id,
        });
    },
});

export const updateNutritionRecord = mutation({
    args: {
        sessionToken: v.string(),
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
        await getRecordWithAccessOrThrow(ctx, args.sessionToken, args.id);
        const { id, sessionToken: _sessionToken, ...updates } = args;
        await ctx.db.patch(id, updates);
        return id;
    },
});

export const deleteNutritionRecord = mutation({
    args: { sessionToken: v.string(), id: v.id("petNutrition") },
    handler: async (ctx, args) => {
        await getRecordWithAccessOrThrow(ctx, args.sessionToken, args.id);
        await ctx.db.delete(args.id);
    },
});
