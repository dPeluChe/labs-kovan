import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireFamilyAccessFromSession } from "../lib/auth";

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

export const seedDefaultActivities = mutation({
  args: {
    sessionToken: v.string(),
    familyId: v.id("families"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireFamilyAccessFromSession(
      ctx,
      args.sessionToken,
      args.familyId
    );

    // Check if already seeded
    const existing = await ctx.db
      .query("householdActivities")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .first();

    if (existing) return; // Already seeded

    await Promise.all(
      DEFAULT_ACTIVITIES.map((activity) =>
        ctx.db.insert("householdActivities", {
          familyId: args.familyId,
          name: activity.name,
          emoji: activity.emoji,
          points: activity.points,
          category: activity.category,
          isActive: true,
          createdBy: user._id,
        })
      )
    );
  },
});

export const createActivity = mutation({
  args: {
    sessionToken: v.string(),
    familyId: v.id("families"),
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
    const { user } = await requireFamilyAccessFromSession(
      ctx,
      args.sessionToken,
      args.familyId
    );

    return await ctx.db.insert("householdActivities", {
      familyId: args.familyId,
      name: args.name,
      emoji: args.emoji,
      points: args.points,
      category: args.category,
      isActive: true,
      createdBy: user._id,
    });
  },
});

export const updateActivity = mutation({
  args: {
    sessionToken: v.string(),
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
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);

    const activity = await ctx.db.get(args.activityId);
    if (!activity) throw new Error("Activity not found");
    if (activity.familyId !== args.familyId) throw new Error("Unauthorized");

    const { sessionToken: _t, activityId, familyId: _familyId, ...updates } = args;
    await ctx.db.patch(activityId, updates);
  },
});

export const deleteActivity = mutation({
  args: {
    sessionToken: v.string(),
    activityId: v.id("householdActivities"),
    familyId: v.id("families"),
  },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);

    const activity = await ctx.db.get(args.activityId);
    if (!activity) throw new Error("Activity not found");
    if (activity.familyId !== args.familyId) throw new Error("Unauthorized");

    await ctx.db.delete(args.activityId);
  },
});

export const logActivity = mutation({
  args: {
    sessionToken: v.string(),
    familyId: v.id("families"),
    activityId: v.id("householdActivities"),
    userId: v.id("users"), // Who did the activity (may differ from loggedBy)
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user: loggedByUser } = await requireFamilyAccessFromSession(
      ctx,
      args.sessionToken,
      args.familyId
    );

    const activity = await ctx.db.get(args.activityId);
    if (!activity) throw new Error("Activity not found");
    if (activity.familyId !== args.familyId) throw new Error("Unauthorized");

    // If logging for a different family member, verify that member is actually
    // part of the same family.
    if (args.userId !== loggedByUser._id) {
      const otherMembership = await ctx.db
        .query("familyMembers")
        .withIndex("by_family_user", (q) =>
          q.eq("familyId", args.familyId).eq("userId", args.userId)
        )
        .first();
      if (!otherMembership || otherMembership.status !== "active") {
        throw new Error("El usuario no es miembro activo de esta familia");
      }
    }

    return await ctx.db.insert("householdActivityLogs", {
      familyId: args.familyId,
      activityId: args.activityId,
      userId: args.userId,
      loggedBy: loggedByUser._id,
      points: activity.points,
      date: Date.now(),
      notes: args.notes,
    });
  },
});

export const deleteLog = mutation({
  args: {
    sessionToken: v.string(),
    logId: v.id("householdActivityLogs"),
    familyId: v.id("families"),
  },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);

    const log = await ctx.db.get(args.logId);
    if (!log) throw new Error("Log not found");
    if (log.familyId !== args.familyId) throw new Error("Unauthorized");

    await ctx.db.delete(args.logId);
  },
});
