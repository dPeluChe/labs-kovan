import { query } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { requireFamilyAccessFromSession } from "../lib/auth";

export const getActivities = query({
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);

    const activities = await ctx.db
      .query("householdActivities")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();

    return activities.filter((a) => a.isActive !== false);
  },
});

export const getAllActivities = query({
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);

    return await ctx.db
      .query("householdActivities")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();
  },
});

export const getRecentLogs = query({
  args: {
    sessionToken: v.string(),
    familyId: v.id("families"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);

    const logs = await ctx.db
      .query("householdActivityLogs")
      .withIndex("by_family_date", (q) => q.eq("familyId", args.familyId))
      .order("desc")
      .take(args.limit ?? 50);

    // Enrich with activity and user data, fetching each doc once
    const activityIds = new Set<Id<"householdActivities">>();
    const userIds = new Set<Id<"users">>();
    for (const log of logs) {
      activityIds.add(log.activityId);
      userIds.add(log.userId);
      if (log.loggedBy !== log.userId) userIds.add(log.loggedBy);
    }

    const [activityEntries, userEntries] = await Promise.all([
      Promise.all(
        [...activityIds].map(async (id) => [id, await ctx.db.get(id)] as const)
      ),
      Promise.all(
        [...userIds].map(async (id) => [id, await ctx.db.get(id)] as const)
      ),
    ]);
    const activitiesById = new Map(activityEntries);
    const usersById = new Map(userEntries);

    return logs.map((log) => {
      const activity = activitiesById.get(log.activityId);
      const user = usersById.get(log.userId);
      const loggedByUser =
        log.loggedBy !== log.userId ? usersById.get(log.loggedBy) : null;
      return {
        ...log,
        activityName: activity?.name ?? "Actividad eliminada",
        activityEmoji: activity?.emoji ?? "❓",
        userName: user?.name ?? "Usuario",
        userPhoto: user?.photoUrl,
        loggedByName: loggedByUser?.name,
      };
    });
  },
});

export const getWeeklyLeaderboard = query({
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);

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
    sessionToken: v.string(),
    familyId: v.id("families"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);

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

    const weeklyLogs = logs.filter((l) => l.userId === args.userId);

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
