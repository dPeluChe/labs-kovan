import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==================== PLANS ====================

export const getPlans = query({
    args: { familyId: v.id("families") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("nutritionPlans")
            .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
            .collect();
    },
});

export const createPlan = mutation({
    args: {
        familyId: v.id("families"),
        name: v.string(),
        description: v.optional(v.string()),
        createdBy: v.optional(v.id("users")),
        targets: v.object({
            calories: v.optional(v.number()),
            protein: v.optional(v.number()),
            carbs: v.optional(v.number()),
            fat: v.optional(v.number()),
            veggies: v.optional(v.number()),
            fruits: v.optional(v.number()),
            dairy: v.optional(v.number()),
            legumes: v.optional(v.number()),
        }),
    },
    handler: async (ctx, args) => {
        let userId = args.createdBy;

        if (!userId) {
            const identity = await ctx.auth.getUserIdentity();
            if (identity) {
                const user = await ctx.db
                    .query("users")
                    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
                    .first();
                if (user) userId = user._id;
            }
        }

        if (!userId) throw new Error("Not authenticated");

        const planId = await ctx.db.insert("nutritionPlans", {
            familyId: args.familyId,
            name: args.name,
            description: args.description,
            targets: args.targets,
            createdBy: userId,
        });
        return planId;
    },
});

export const updatePlan = mutation({
    args: {
        planId: v.id("nutritionPlans"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        targets: v.optional(
            v.object({
                calories: v.optional(v.number()),
                protein: v.optional(v.number()),
                carbs: v.optional(v.number()),
                fat: v.optional(v.number()),
                veggies: v.optional(v.number()),
                fruits: v.optional(v.number()),
                dairy: v.optional(v.number()),
                legumes: v.optional(v.number()),
            })
        ),
    },
    handler: async (ctx, args) => {
        const { planId, ...updates } = args;
        await ctx.db.patch(planId, updates);
    },
});

// ==================== ASSIGNMENTS ====================

export const assignPlan = mutation({
    args: {
        familyId: v.id("families"),
        planId: v.id("nutritionPlans"),
        personId: v.id("personProfiles"),
        startDate: v.number(),
        endDate: v.number(),
    },
    handler: async (ctx, args) => {
        // 1. Validate dates
        if (args.endDate < args.startDate) {
            throw new Error("La fecha de fin debe ser posterior a la fecha de inicio");
        }

        // 2. Check for overlaps
        const existingAssignments = await ctx.db
            .query("nutritionAssignments")
            .withIndex("by_person", (q) => q.eq("personId", args.personId))
            .filter((q) => q.eq(q.field("isActive"), true)) // Only check active/valid assignments
            .collect();

        const hasOverlap = existingAssignments.some((assignment) => {
            // Overlap logic: (StartA <= EndB) and (EndA >= StartB)
            return (
                args.startDate <= assignment.endDate && args.endDate >= assignment.startDate
            );
        });

        if (hasOverlap) {
            throw new Error("Ya existe un plan asignado en ese rango de fechas.");
        }

        // 3. Create assignment
        await ctx.db.insert("nutritionAssignments", {
            familyId: args.familyId,
            planId: args.planId,
            personId: args.personId,
            startDate: args.startDate,
            endDate: args.endDate,
            isActive: true,
        });
    },
});

export const getAssignments = query({
    args: { personId: v.id("personProfiles") },
    handler: async (ctx, args) => {
        const assignments = await ctx.db
            .query("nutritionAssignments")
            .withIndex("by_person", (q) => q.eq("personId", args.personId))
            .order("desc")
            .collect();

        // Enrich with Plan details
        return await Promise.all(
            assignments.map(async (a) => {
                const plan = await ctx.db.get(a.planId);
                return { ...a, plan };
            })
        );
    },
});

export const getActiveAssignment = query({
    args: {
        personId: v.id("personProfiles"),
        date: v.number(), // Timestamp within the day (e.g., now)
    },
    handler: async (ctx, args) => {
        // Find assignment that covers this date
        const assignments = await ctx.db
            .query("nutritionAssignments")
            .withIndex("by_person", (q) => q.eq("personId", args.personId))
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();

        // In-memory filter for range (since we can't easily range-index multiple fields efficiently without specific setup)
        // Given the low volume per person, this is fine.
        const active = assignments.find(
            (a) => args.date >= a.startDate && args.date <= a.endDate
        );

        if (!active) return null;

        const plan = await ctx.db.get(active.planId);
        return { ...active, plan };
    },
});

// ==================== LOGS ====================

export const getDailyLog = query({
    args: {
        personId: v.id("personProfiles"),
        date: v.string(), // YYYY-MM-DD
    },
    handler: async (ctx, args) => {
        const log = await ctx.db
            .query("nutritionLogs")
            .withIndex("by_person_date", (q) =>
                q.eq("personId", args.personId).eq("date", args.date)
            )
            .first();

        return log;
    },
});

export const logIntake = mutation({
    args: {
        familyId: v.id("families"),
        personId: v.id("personProfiles"),
        date: v.string(), // YYYY-MM-DD
        type: v.string(), // 'protein', 'carbs', etc.
        delta: v.number(), // +1 or -1
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("nutritionLogs")
            .withIndex("by_person_date", (q) =>
                q.eq("personId", args.personId).eq("date", args.date)
            )
            .first();

        if (existing) {
            const currentVal = existing.consumed[args.type as keyof typeof existing.consumed] || 0;
            const newVal = Math.max(0, currentVal + args.delta); // Prevent negative

            await ctx.db.patch(existing._id, {
                consumed: {
                    ...existing.consumed,
                    [args.type]: newVal,
                },
            });
        } else {
            // Create new log
            await ctx.db.insert("nutritionLogs", {
                familyId: args.familyId,
                personId: args.personId,
                date: args.date,
                consumed: {
                    [args.type]: Math.max(0, args.delta),
                },
            });
        }
    },
});

export const getMeals = query({
    args: {
        personId: v.id("personProfiles"),
        date: v.string(), // YYYY-MM-DD
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("nutritionMeals")
            .withIndex("by_person_date", (q) =>
                q.eq("personId", args.personId).eq("date", args.date)
            )
            .order("desc") // Most recent first
            .collect();
    },
});

export const logMeal = mutation({
    args: {
        familyId: v.id("families"),
        personId: v.id("personProfiles"),
        date: v.string(),
        name: v.string(),
        content: v.object({
            protein: v.optional(v.number()),
            carbs: v.optional(v.number()),
            fat: v.optional(v.number()),
            veggies: v.optional(v.number()),
            fruits: v.optional(v.number()),
            dairy: v.optional(v.number()),
            legumes: v.optional(v.number()),
            water: v.optional(v.number()),
            other: v.optional(v.number()),
        }),
        addedBy: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        let userId = args.addedBy;
        if (!userId) {
            const identity = await ctx.auth.getUserIdentity();
            if (identity) {
                const user = await ctx.db
                    .query("users")
                    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
                    .first();
                if (user) userId = user._id;
            }
        }

        // 1. Record the individual meal
        await ctx.db.insert("nutritionMeals", {
            familyId: args.familyId,
            personId: args.personId,
            date: args.date,
            name: args.name,
            content: args.content,
            timestamp: Date.now(),
            addedBy: userId,
        });

        // 2. Update the daily log aggregates
        const existingLog = await ctx.db
            .query("nutritionLogs")
            .withIndex("by_person_date", (q) =>
                q.eq("personId", args.personId).eq("date", args.date)
            )
            .first();

        const updates: any = existingLog ? { ...existingLog.consumed } : {};

        // Sum up new values
        Object.entries(args.content).forEach(([key, value]) => {
            if (typeof value === "number" && value > 0) {
                updates[key] = (updates[key] || 0) + value;
            }
        });

        if (existingLog) {
            await ctx.db.patch(existingLog._id, { consumed: updates });
        } else {
            await ctx.db.insert("nutritionLogs", {
                familyId: args.familyId,
                personId: args.personId,
                date: args.date,
                consumed: updates,
            });
        }
    },
});
