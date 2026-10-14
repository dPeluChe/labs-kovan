import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireFamilyAccessFromSession, requireUserFromSessionToken } from "../lib/auth";
import { getPlanWithAccessOrThrow } from "./access";

export const getPlans = query({
    args: { sessionToken: v.string(), familyId: v.id("families") },
    handler: async (ctx, args) => {
        await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
        return await ctx.db
            .query("nutritionPlans")
            .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
            .collect();
    },
});

export const createPlan = mutation({
    args: {
        sessionToken: v.string(),
        familyId: v.id("families"),
        name: v.string(),
        description: v.optional(v.string()),
        targets: v.object({
            calories: v.optional(v.number()),
            protein: v.optional(v.number()),
            carbs: v.optional(v.number()),
            fat: v.optional(v.number()),
            veggies: v.optional(v.number()),
            fruits: v.optional(v.number()),
            dairy: v.optional(v.number()),
            legumes: v.optional(v.number()),
        }),
    },
    handler: async (ctx, args) => {
        const user = await requireUserFromSessionToken(ctx, args.sessionToken);
        await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);

        const planId = await ctx.db.insert("nutritionPlans", {
            familyId: args.familyId,
            name: args.name,
            description: args.description,
            targets: args.targets,
            createdBy: user._id,
        });
        return planId;
    },
});

export const updatePlan = mutation({
    args: {
        sessionToken: v.string(),
        planId: v.id("nutritionPlans"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        targets: v.optional(
            v.object({
                calories: v.optional(v.number()),
                protein: v.optional(v.number()),
                carbs: v.optional(v.number()),
                fat: v.optional(v.number()),
                veggies: v.optional(v.number()),
                fruits: v.optional(v.number()),
                dairy: v.optional(v.number()),
                legumes: v.optional(v.number()),
            })
        ),
    },
    handler: async (ctx, args) => {
        await getPlanWithAccessOrThrow(ctx, args.sessionToken, args.planId);
        const { planId, sessionToken: _sessionToken, ...updates } = args;
        await ctx.db.patch(planId, updates);
    },
});
