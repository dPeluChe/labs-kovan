import { v } from "convex/values";
import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { requireFamilyAccessFromSession } from "./lib/auth";

// ==================== TYPE DEFINITIONS ====================
const EXPENSE_TYPE = v.union(
  v.literal("general"),
  v.literal("subscription"),
  v.literal("vehicle"),
  v.literal("gift"),
  v.literal("trip")
);

const CATEGORY_TYPE = v.union(
  v.literal("food"),
  v.literal("transport"),
  v.literal("entertainment"),
  v.literal("utilities"),
  v.literal("health"),
  v.literal("shopping"),
  v.literal("home"),
  v.literal("education"),
  v.literal("gifts"),
  v.literal("vehicle"),
  v.literal("subscription"),
  v.literal("trip"),
  v.literal("other")
);

// ==================== QUERIES ====================
export const getExpenses = query({
  args: {
    sessionToken: v.string(),
    familyId: v.id("families"),
    type: v.optional(EXPENSE_TYPE),
    limit: v.optional(v.number())
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

    // Por tipo
    const byType: Record<string, { total: number; count: number }> = {};
    thisMonth.forEach((e) => {
      if (!byType[e.type]) byType[e.type] = { total: 0, count: 0 };
      byType[e.type].total += e.amount;
      byType[e.type].count += 1;
    });

    // Por categoría
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

// ==================== MUTATIONS ====================
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
    // Relaciones opcionales
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

// ==================== SUBSCRIPTIONS ====================
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
    // Also delete related expenses
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_subscription", (q) => q.eq("subscriptionId", args.subscriptionId))
      .collect();

    await Promise.all(expenses.map((e) => ctx.db.delete(e._id)));
    return await ctx.db.delete(args.subscriptionId);
  },
});

// Registrar pago de suscripción (crea expense)
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

// Agent-only helpers (called from server action after user/family validation in agent.ts)
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
