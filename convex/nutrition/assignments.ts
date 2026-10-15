import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireFamilyAccessFromSession } from "../lib/auth";
import { getPersonWithAccessOrThrow, getPlanWithAccessOrThrow } from "./access";

export const assignPlan = mutation({
    args: {
        sessionToken: v.string(),
        familyId: v.id("families"),
        planId: v.id("nutritionPlans"),
        personId: v.id("personProfiles"),
        startDate: v.number(),
        endDate: v.number(),
    },
    handler: async (ctx, args) => {
        await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
        const [{ plan }, { person }] = await Promise.all([
            getPlanWithAccessOrThrow(ctx, args.sessionToken, args.planId),
            getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId),
        ]);
        if (plan.familyId !== args.familyId || person.familyId !== args.familyId) {
            throw new Error("Plan o perfil no pertenecen a la familia");
        }
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
    args: { sessionToken: v.string(), personId: v.id("personProfiles") },
    handler: async (ctx, args) => {
        await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
        const assignments = await ctx.db
            .query("nutritionAssignments")
            .withIndex("by_person", (q) => q.eq("personId", args.personId))
            .order("desc")
            .collect();

        // Enrich with Plan details, fetching each plan once
        const planIds = [...new Set(assignments.map((a) => a.planId))];
        const plans = await Promise.all(planIds.map((id) => ctx.db.get(id)));
        const plansById = new Map(planIds.map((id, i) => [id, plans[i]] as const));

        return assignments.map((a) => ({
            ...a,
            plan: plansById.get(a.planId) ?? null,
        }));
    },
});

export const getActiveAssignment = query({
    args: {
        sessionToken: v.string(),
        personId: v.id("personProfiles"),
        date: v.number(), // Timestamp within the day (e.g., now)
    },
    handler: async (ctx, args) => {
        await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
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
