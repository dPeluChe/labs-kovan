import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

const CATEGORY_TYPE = v.union(
  v.literal("food"),
  v.literal("transport"),
  v.literal("entertainment"),
  v.literal("utilities"),
  v.literal("health"),
  v.literal("shopping"),
  v.literal("other")
);

export const getExpenses = query({
  args: { familyId: v.id("families"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("expenses")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .order("desc")
      .take(limit);
  },
});

export const getExpensesByMonth = query({
  args: { familyId: v.id("families"), year: v.number(), month: v.number() },
  handler: async (ctx, args) => {
    const startOfMonth = new Date(args.year, args.month - 1, 1).getTime();
    const endOfMonth = new Date(args.year, args.month, 0, 23, 59, 59, 999).getTime();

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();

    return expenses.filter((e) => e.date >= startOfMonth && e.date <= endOfMonth);
  },
});

export const createExpense = mutation({
  args: {
    familyId: v.id("families"),
    category: CATEGORY_TYPE,
    description: v.string(),
    amount: v.number(),
    date: v.number(),
    paidBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("expenses", args);
  },
});

export const updateExpense = mutation({
  args: {
    expenseId: v.id("expenses"),
    category: v.optional(CATEGORY_TYPE),
    description: v.optional(v.string()),
    amount: v.optional(v.number()),
    date: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { expenseId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    return await ctx.db.patch(expenseId, filteredUpdates);
  },
});

export const deleteExpense = mutation({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.expenseId);
  },
});

export const getExpenseSummary = query({
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

    const byCategory: Record<string, number> = {};
    thisMonth.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });

    return {
      totalThisMonth,
      countThisMonth: thisMonth.length,
      byCategory,
    };
  },
});
