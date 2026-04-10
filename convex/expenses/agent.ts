import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { CATEGORY_TYPE, EXPENSE_TYPE } from "./types";

export const agentGetExpenseSummary = internalQuery({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();

    const thisMonth = expenses.filter((e) => e.date >= startOfMonth);
    const totalThisMonth = thisMonth.reduce((sum, e) => sum + e.amount, 0);
    const byType: Record<string, { total: number; count: number }> = {};
    const byCategory: Record<string, number> = {};

    thisMonth.forEach((e) => {
      if (!byType[e.type]) byType[e.type] = { total: 0, count: 0 };
      byType[e.type].total += e.amount;
      byType[e.type].count += 1;
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

export const agentCreateExpense = internalMutation({
  args: {
    familyId: v.id("families"),
    type: EXPENSE_TYPE,
    category: CATEGORY_TYPE,
    description: v.string(),
    amount: v.number(),
    date: v.number(),
    paidBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
    tripId: v.optional(v.id("trips")),
    vehicleId: v.optional(v.id("vehicles")),
    vehicleEventId: v.optional(v.id("vehicleEvents")),
    subscriptionId: v.optional(v.id("subscriptions")),
    giftItemId: v.optional(v.id("giftItems")),
    giftEventId: v.optional(v.id("giftEvents")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("expenses", args);
  },
});
