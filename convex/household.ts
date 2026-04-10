import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// ==================== DEFAULT ACTIVITIES ====================

const DEFAULT_ACTIVITIES = [
  { name: "Lavar platos", emoji: "🍽️", points: 5, category: "cleaning" as const },
  { name: "Cocinar", emoji: "🍳", points: 10, category: "cooking" as const },
  { name: "Barrer", emoji: "🧹", points: 5, category: "cleaning" as const },
  { name: "Trapear", emoji: "🪣", points: 7, category: "cleaning" as const },
  { name: "Aspirar", emoji: "🧹", points: 7, category: "cleaning" as const },
  { name: "Lavar ropa", emoji: "👕", points: 8, category: "laundry" as const },
  { name: "Tender ropa", emoji: "👔", points: 5, category: "laundry" as const },
  { name: "Doblar ropa", emoji: "🧺", points: 5, category: "laundry" as const },
  { name: "Planchar", emoji: "🫧", points: 6, category: "laundry" as const },
  { name: "Sacar basura", emoji: "🗑️", points: 3, category: "cleaning" as const },
  { name: "Limpiar baño", emoji: "🚿", points: 8, category: "cleaning" as const },
  { name: "Hacer cama", emoji: "🛏️", points: 3, category: "organization" as const },
  { name: "Ordenar cuarto", emoji: "🏠", points: 5, category: "organization" as const },
  { name: "Ir al super", emoji: "🛒", points: 10, category: "errands" as const },
  { name: "Pasear al perro", emoji: "🐕", points: 5, category: "pets" as const },
  { name: "Alimentar mascotas", emoji: "🐾", points: 3, category: "pets" as const },
  { name: "Regar plantas", emoji: "🌱", points: 3, category: "maintenance" as const },
  { name: "Lavar el carro", emoji: "🚗", points: 8, category: "maintenance" as const },
];

// ==================== QUERIES ====================

export const getActivities = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("householdActivities")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();

    return activities.filter((a) => a.isActive !== false);
  },
});

export const getAllActivities = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("householdActivities")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();
  },
});

export const getRecentLogs = query({
  args: {
    familyId: v.id("families"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("householdActivityLogs")
      .withIndex("by_family_date", (q) => q.eq("familyId", args.familyId))
      .order("desc")
      .take(args.limit ?? 50);

    // Enrich with activity and user data
    const enriched = await Promise.all(
      logs.map(async (log) => {
        const activity = await ctx.db.get(log.activityId);
        const user = await ctx.db.get(log.userId);
        const loggedByUser = log.loggedBy !== log.userId ? await ctx.db.get(log.loggedBy) : null;
        return {
          ...log,
          activityName: activity?.name ?? "Actividad eliminada",
          activityEmoji: activity?.emoji ?? "❓",
          userName: user?.name ?? "Usuario",
          userPhoto: user?.photoUrl,
          loggedByName: loggedByUser?.name,
        };
      })
    );

    return enriched;
  },
});

export const getWeeklyLeaderboard = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    // Calculate start of current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const weekStart = monday.getTime();

    const logs = await ctx.db
      .query("householdActivityLogs")
      .withIndex("by_family_date", (q) =>
        q.eq("familyId", args.familyId).gte("date", weekStart)
      )
      .collect();

    // Aggregate points per user
    const userPoints: Record<
      Id<"users">,
      { userId: Id<"users">; points: number; activities: number }
    > = {};
    for (const log of logs) {
      const key = log.userId;
      if (!userPoints[key]) {
        userPoints[key] = { userId: key, points: 0, activities: 0 };
      }
      userPoints[key].points += log.points;
      userPoints[key].activities += 1;
    }

    // Sort by points descending
    const sorted = Object.values(userPoints).sort((a, b) => b.points - a.points);

    // Enrich with user data
    const enriched = await Promise.all(
      sorted.map(async (entry, index) => {
        const user = await ctx.db.get(entry.userId);
        return {
          ...entry,
          rank: index + 1,
          userName: user?.name ?? "Usuario",
          userPhoto: user?.photoUrl,
        };
      })
    );

    return {
      weekStart,
      leaderboard: enriched,
      totalActivities: logs.length,
      totalPoints: logs.reduce((sum, l) => sum + l.points, 0),
    };
  },
});

export const getUserWeeklyStats = query({
  args: {
    familyId: v.id("families"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const weekStart = monday.getTime();

    const logs = await ctx.db
      .query("householdActivityLogs")
      .withIndex("by_family_user", (q) =>
        q.eq("familyId", args.familyId).eq("userId", args.userId)
      )
      .collect();

    const weeklyLogs = logs.filter((l) => l.date >= weekStart);

    // Activity breakdown
    const activityCounts: Record<Id<"householdActivities">, number> = {};
    for (const log of weeklyLogs) {
      const key = log.activityId;
      activityCounts[key] = (activityCounts[key] || 0) + 1;
    }

    // Get activity names for breakdown
    const breakdown = await Promise.all(
      (Object.entries(activityCounts) as [Id<"householdActivities">, number][]).map(
        async ([actId, count]) => {
          const activity = await ctx.db.get(actId);
          return {
            name: activity?.name ?? "?",
            emoji: activity?.emoji ?? "❓",
            count,
          };
        }
      )
    );

    return {
      totalPoints: weeklyLogs.reduce((sum, l) => sum + l.points, 0),
      totalActivities: weeklyLogs.length,
      breakdown: breakdown.sort((a, b) => b.count - a.count),
    };
  },
});

// ==================== MUTATIONS ====================

export const seedDefaultActivities = mutation({
  args: {
    familyId: v.id("families"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if already seeded
    const existing = await ctx.db
      .query("householdActivities")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .first();

    if (existing) return; // Already seeded

    for (const activity of DEFAULT_ACTIVITIES) {
      await ctx.db.insert("householdActivities", {
        familyId: args.familyId,
        name: activity.name,
        emoji: activity.emoji,
        points: activity.points,
        category: activity.category,
        isActive: true,
        createdBy: args.userId,
      });
    }
  },
});

export const createActivity = mutation({
  args: {
    familyId: v.id("families"),
    userId: v.id("users"),
    name: v.string(),
    emoji: v.string(),
    points: v.number(),
    category: v.union(
      v.literal("cleaning"),
      v.literal("cooking"),
      v.literal("laundry"),
      v.literal("organization"),
      v.literal("maintenance"),
      v.literal("pets"),
      v.literal("errands"),
      v.literal("other")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("householdActivities", {
      familyId: args.familyId,
      name: args.name,
      emoji: args.emoji,
      points: args.points,
      category: args.category,
      isActive: true,
      createdBy: args.userId,
    });
  },
});

export const updateActivity = mutation({
  args: {
    activityId: v.id("householdActivities"),
    familyId: v.id("families"),
    name: v.optional(v.string()),
    emoji: v.optional(v.string()),
    points: v.optional(v.number()),
    category: v.optional(
      v.union(
        v.literal("cleaning"),
        v.literal("cooking"),
        v.literal("laundry"),
        v.literal("organization"),
        v.literal("maintenance"),
        v.literal("pets"),
        v.literal("errands"),
        v.literal("other")
      )
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.activityId);
    if (!activity) throw new Error("Activity not found");
    if (activity.familyId !== args.familyId) throw new Error("Unauthorized");

    const { activityId, familyId: _familyId, ...updates } = args;
    await ctx.db.patch(activityId, updates);
  },
});

export const deleteActivity = mutation({
  args: {
    activityId: v.id("householdActivities"),
    familyId: v.id("families"),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.activityId);
    if (!activity) throw new Error("Activity not found");
    if (activity.familyId !== args.familyId) throw new Error("Unauthorized");

    await ctx.db.delete(args.activityId);
  },
});

export const logActivity = mutation({
  args: {
    familyId: v.id("families"),
    activityId: v.id("householdActivities"),
    userId: v.id("users"), // Who did the activity
    loggedBy: v.id("users"), // Who is logging it
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.activityId);
    if (!activity) throw new Error("Activity not found");
    if (activity.familyId !== args.familyId) throw new Error("Unauthorized");

    return await ctx.db.insert("householdActivityLogs", {
      familyId: args.familyId,
      activityId: args.activityId,
      userId: args.userId,
      loggedBy: args.loggedBy,
      points: activity.points,
      date: Date.now(),
      notes: args.notes,
    });
  },
});

export const deleteLog = mutation({
  args: {
    logId: v.id("householdActivityLogs"),
    familyId: v.id("families"),
  },
  handler: async (ctx, args) => {
    const log = await ctx.db.get(args.logId);
    if (!log) throw new Error("Log not found");
    if (log.familyId !== args.familyId) throw new Error("Unauthorized");

    await ctx.db.delete(args.logId);
  },
});
