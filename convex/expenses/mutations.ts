import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireFamilyAccessFromSession } from "../lib/auth";
import { CATEGORY_TYPE, EXPENSE_TYPE } from "./types";

export const createExpense = mutation({
  args: {
    sessionToken: v.string(),
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
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const { sessionToken: _sessionToken, ...expense } = args;
    return await ctx.db.insert("expenses", expense);
  },
});

export const updateExpense = mutation({
  args: {
    sessionToken: v.string(),
    expenseId: v.id("expenses"),
    type: v.optional(EXPENSE_TYPE),
    category: v.optional(CATEGORY_TYPE),
    description: v.optional(v.string()),
    amount: v.optional(v.number()),
    date: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.expenseId);
    if (!existing) throw new Error("Gasto no encontrado");
    await requireFamilyAccessFromSession(ctx, args.sessionToken, existing.familyId);
    const { expenseId, sessionToken: _sessionToken, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    return await ctx.db.patch(expenseId, filteredUpdates);
  },
});

export const deleteExpense = mutation({
  args: { sessionToken: v.string(), expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.expenseId);
    if (!existing) return;
    await requireFamilyAccessFromSession(ctx, args.sessionToken, existing.familyId);
    return await ctx.db.delete(args.expenseId);
  },
});
