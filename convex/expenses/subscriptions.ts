import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireFamilyAccessFromSession } from "../lib/auth";

export const getSubscriptions = query({
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();
  },
});

export const createSubscription = mutation({
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
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const { sessionToken: _sessionToken, ...payload } = args;
    return await ctx.db.insert("subscriptions", {
      ...payload,
      isActive: true,
    });
  },
});

export const updateSubscription = mutation({
  args: {
    sessionToken: v.string(),
    subscriptionId: v.id("subscriptions"),
    name: v.optional(v.string()),
    amount: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription) throw new Error("Suscripción no encontrada");
    await requireFamilyAccessFromSession(ctx, args.sessionToken, subscription.familyId);
    const { subscriptionId, sessionToken: _sessionToken, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    return await ctx.db.patch(subscriptionId, filteredUpdates);
  },
});

export const deleteSubscription = mutation({
  args: { sessionToken: v.string(), subscriptionId: v.id("subscriptions") },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription) return null;
    await requireFamilyAccessFromSession(ctx, args.sessionToken, subscription.familyId);
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_subscription", (q) => q.eq("subscriptionId", args.subscriptionId))
      .collect();

    await Promise.all(expenses.map((e) => ctx.db.delete(e._id)));
    return await ctx.db.delete(args.subscriptionId);
  },
});

export const recordSubscriptionPayment = mutation({
  args: {
    sessionToken: v.string(),
    subscriptionId: v.id("subscriptions"),
    familyId: v.id("families"),
    amount: v.number(),
    date: v.number(),
    paidBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription) throw new Error("Suscripción no encontrada");

    return await ctx.db.insert("expenses", {
      familyId: args.familyId,
      type: "subscription",
      category: "subscription",
      description: `Pago: ${subscription.name}`,
      amount: args.amount,
      date: args.date,
      paidBy: args.paidBy,
      notes: args.notes,
      subscriptionId: args.subscriptionId,
    });
  },
});
