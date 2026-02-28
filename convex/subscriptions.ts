import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireFamilyAccessFromSession } from "./lib/auth";

export const list = query({
    args: { sessionToken: v.string(), familyId: v.id("families") },
    handler: async (ctx, args) => {
        await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
        return await ctx.db
            .query("subscriptions")
            .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
            .collect();
    },
});

export const create = mutation({
    args: {
        sessionToken: v.string(),
        familyId: v.id("families"),
        name: v.string(),
        type: v.union(
            v.literal("streaming"),
            v.literal("utility"),
            v.literal("internet"),
            v.literal("insurance"),
            v.literal("membership"),
            v.literal("software"),
            v.literal("other")
        ),
        amount: v.optional(v.number()),
        billingCycle: v.union(
            v.literal("monthly"),
            v.literal("bimonthly"),
            v.literal("quarterly"),
            v.literal("annual"),
            v.literal("variable")
        ),
        dueDay: v.optional(v.number()),
        referenceNumber: v.optional(v.string()),
        barcodeType: v.optional(v.union(v.literal("code128"), v.literal("qr"))),
        barcodeValue: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
        return await ctx.db.insert("subscriptions", {
            familyId: args.familyId,
            name: args.name,
            type: args.type,
            amount: args.amount,
            billingCycle: args.billingCycle,
            dueDay: args.dueDay,
            referenceNumber: args.referenceNumber,
            barcodeType: args.barcodeType,
            barcodeValue: args.barcodeValue,
            notes: args.notes,
            isActive: true,
        });
    },
});

export const update = mutation({
    args: {
        sessionToken: v.string(),
        subscriptionId: v.id("subscriptions"),
        name: v.optional(v.string()),
        type: v.optional(v.union(
            v.literal("streaming"),
            v.literal("utility"),
            v.literal("internet"),
            v.literal("insurance"),
            v.literal("membership"),
            v.literal("software"),
            v.literal("other")
        )),
        amount: v.optional(v.number()),
        billingCycle: v.optional(v.union(
            v.literal("monthly"),
            v.literal("bimonthly"),
            v.literal("quarterly"),
            v.literal("annual"),
            v.literal("variable")
        )),
        dueDay: v.optional(v.number()),
        isActive: v.optional(v.boolean()),
        referenceNumber: v.optional(v.string()),
        barcodeType: v.optional(v.union(v.literal("code128"), v.literal("qr"))),
        barcodeValue: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { subscriptionId, sessionToken: _sessionToken, ...updates } = args;
        const sub = await ctx.db.get(subscriptionId);
        if (!sub) throw new Error("Subscription not found");
        await requireFamilyAccessFromSession(ctx, args.sessionToken, sub.familyId);
        await ctx.db.patch(subscriptionId, updates);
    },
});

export const deleteSubscription = mutation({
    args: {
        sessionToken: v.string(),
        subscriptionId: v.id("subscriptions"),
    },
    handler: async (ctx, args) => {
        const sub = await ctx.db.get(args.subscriptionId);
        if (!sub) throw new Error("Subscription not found");
        await requireFamilyAccessFromSession(ctx, args.sessionToken, sub.familyId);
        await ctx.db.delete(args.subscriptionId);
    },
});
