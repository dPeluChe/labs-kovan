import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireFamilyAccessFromSession, requireUserFromSessionToken } from "../lib/auth";
import { getPersonWithAccessOrThrow } from "./access";

export const getDailyLog = query({
    args: {
        sessionToken: v.string(),
        personId: v.id("personProfiles"),
        date: v.string(), // YYYY-MM-DD
    },
    handler: async (ctx, args) => {
        await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
        const log = await ctx.db
            .query("nutritionLogs")
            .withIndex("by_person_date", (q) =>
                q.eq("personId", args.personId).eq("date", args.date)
            )
            .first();

        return log;
    },
});

export const logIntake = mutation({
    args: {
        sessionToken: v.string(),
        familyId: v.id("families"),
        personId: v.id("personProfiles"),
        date: v.string(), // YYYY-MM-DD
        type: v.string(), // 'protein', 'carbs', etc.
        delta: v.number(), // +1 or -1
    },
    handler: async (ctx, args) => {
        await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
        const person = await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
        if (person.familyId !== args.familyId) {
            throw new Error("Perfil no pertenece a la familia");
        }
        const existing = await ctx.db
            .query("nutritionLogs")
            .withIndex("by_person_date", (q) =>
                q.eq("personId", args.personId).eq("date", args.date)
            )
            .first();

        if (existing) {
            const currentVal = existing.consumed[args.type as keyof typeof existing.consumed] || 0;
            const newVal = Math.max(0, currentVal + args.delta); // Prevent negative

            await ctx.db.patch(existing._id, {
                consumed: {
                    ...existing.consumed,
                    [args.type]: newVal,
                },
            });
        } else {
            // Create new log
            await ctx.db.insert("nutritionLogs", {
                familyId: args.familyId,
                personId: args.personId,
                date: args.date,
                consumed: {
                    [args.type]: Math.max(0, args.delta),
                },
            });
        }
    },
});

export const getMeals = query({
    args: {
        sessionToken: v.string(),
        personId: v.id("personProfiles"),
        date: v.string(), // YYYY-MM-DD
    },
    handler: async (ctx, args) => {
        await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
        return await ctx.db
            .query("nutritionMeals")
            .withIndex("by_person_date", (q) =>
                q.eq("personId", args.personId).eq("date", args.date)
            )
            .order("desc") // Most recent first
            .collect();
    },
});

export const logMeal = mutation({
    args: {
        sessionToken: v.string(),
        familyId: v.id("families"),
        personId: v.id("personProfiles"),
        date: v.string(),
        name: v.string(),
        content: v.object({
            protein: v.optional(v.number()),
            carbs: v.optional(v.number()),
            fat: v.optional(v.number()),
            veggies: v.optional(v.number()),
            fruits: v.optional(v.number()),
            dairy: v.optional(v.number()),
            legumes: v.optional(v.number()),
            water: v.optional(v.number()),
            other: v.optional(v.number()),
        }),
    },
    handler: async (ctx, args) => {
        const user = await requireUserFromSessionToken(ctx, args.sessionToken);
        await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
        const person = await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
        if (person.familyId !== args.familyId) {
            throw new Error("Perfil no pertenece a la familia");
        }

        // 1. Record the individual meal
        await ctx.db.insert("nutritionMeals", {
            familyId: args.familyId,
            personId: args.personId,
            date: args.date,
            name: args.name,
            content: args.content,
            timestamp: Date.now(),
            addedBy: user._id,
        });

        // 2. Update the daily log aggregates
        const existingLog = await ctx.db
            .query("nutritionLogs")
            .withIndex("by_person_date", (q) =>
                q.eq("personId", args.personId).eq("date", args.date)
            )
            .first();

        const updates: Record<string, number> = existingLog ? { ...existingLog.consumed } : {};

        // Sum up new values
        Object.entries(args.content).forEach(([key, value]) => {
            if (typeof value === "number" && value > 0) {
                updates[key] = (updates[key] || 0) + value;
            }
        });

        if (existingLog) {
            await ctx.db.patch(existingLog._id, { consumed: updates });
        } else {
            await ctx.db.insert("nutritionLogs", {
                familyId: args.familyId,
                personId: args.personId,
                date: args.date,
                consumed: updates,
            });
        }
    },
});
