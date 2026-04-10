import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireFamilyAccessFromSession } from "../lib/auth";
import { EXPENSE_TYPE } from "./types";

export const getExpenses = query({
  args: {
    sessionToken: v.string(),
    familyId: v.id("families"),
    type: v.optional(EXPENSE_TYPE),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const limit = args.limit ?? 50;

    if (args.type) {
      return await ctx.db
        .query("expenses")
        .withIndex("by_family_type", (q) =>
          q.eq("familyId", args.familyId).eq("type", args.type!)
        )
        .order("desc")
        .take(limit);
    }

    return await ctx.db
      .query("expenses")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .order("desc")
      .take(limit);
  },
});

export const getExpensesByVehicle = query({
  args: { sessionToken: v.string(), vehicleId: v.id("vehicles") },
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get(args.vehicleId);
    if (!vehicle) return [];
    await requireFamilyAccessFromSession(ctx, args.sessionToken, vehicle.familyId);
    return await ctx.db
      .query("expenses")
      .withIndex("by_vehicle", (q) => q.eq("vehicleId", args.vehicleId))
      .order("desc")
      .collect();
  },
});

export const getExpensesBySubscription = query({
  args: { sessionToken: v.string(), subscriptionId: v.id("subscriptions") },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription) return [];
    await requireFamilyAccessFromSession(ctx, args.sessionToken, subscription.familyId);
    return await ctx.db
      .query("expenses")
      .withIndex("by_subscription", (q) => q.eq("subscriptionId", args.subscriptionId))
      .order("desc")
      .collect();
  },
});

export const getExpensesByGiftEvent = query({
  args: { sessionToken: v.string(), giftEventId: v.id("giftEvents") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.giftEventId);
    if (!event) return [];
    await requireFamilyAccessFromSession(ctx, args.sessionToken, event.familyId);
    return await ctx.db
      .query("expenses")
      .withIndex("by_gift_event", (q) => q.eq("giftEventId", args.giftEventId))
      .order("desc")
      .collect();
  },
});

export const getExpensesByTrip = query({
  args: { sessionToken: v.string(), tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) return [];
    await requireFamilyAccessFromSession(ctx, args.sessionToken, trip.familyId);
    return await ctx.db
      .query("expenses")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .order("desc")
      .collect();
  },
});

export const getExpensesByMonth = query({
  args: { sessionToken: v.string(), familyId: v.id("families"), year: v.number(), month: v.number() },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const startOfMonth = new Date(args.year, args.month - 1, 1).getTime();
    const endOfMonth = new Date(args.year, args.month, 0, 23, 59, 59, 999).getTime();

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();

    return expenses.filter((e) => e.date >= startOfMonth && e.date <= endOfMonth);
  },
});

export const getExpenseSummary = query({
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();

    const thisMonth = expenses.filter((e) => e.date >= startOfMonth);
    const totalThisMonth = thisMonth.reduce((sum, e) => sum + e.amount, 0);

    const byType: Record<string, { total: number; count: number }> = {};
    thisMonth.forEach((e) => {
      if (!byType[e.type]) byType[e.type] = { total: 0, count: 0 };
      byType[e.type].total += e.amount;
      byType[e.type].count += 1;
    });

    const byCategory: Record<string, number> = {};
    thisMonth.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });

    return {
      totalThisMonth,
      countThisMonth: thisMonth.length,
      byType,
      byCategory,
    };
  },
});
