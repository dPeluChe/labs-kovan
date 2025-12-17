import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// === QUERIES ===

export const list = query({
    args: {
        familyId: v.id("families"),
        status: v.optional(v.union(v.literal("pending"), v.literal("completed"))),
        type: v.optional(v.union(v.literal("general"), v.literal("shopping"), v.literal("chore"))),
    },
    handler: async (ctx, args) => {
        const q = ctx.db
            .query("tasks")
            .withIndex("by_family", (q) => q.eq("familyId", args.familyId));

        let tasks = await q.collect();

        if (args.status) {
            tasks = tasks.filter((t) => t.status === args.status);
        }

        if (args.type) {
            tasks = tasks.filter((t) => t.type === args.type);
        }

        // Sort: Pending first, then by dueDate (if exists), then creation? 
        // Usually frontend handles complex sorting, but let's give a sensible default.
        // Logic: 
        // 1. Pending tasks with due dates go first (soonest first).
        // 2. Pending tasks without due dates.
        // 3. Completed tasks (most recently completed first - though we don't track completionDate, just creation).

        return tasks.sort((a, b) => {
            // If status implies defined order
            if (a.status !== b.status) {
                return a.status === "pending" ? -1 : 1;
            }

            // If both pending, check due dates
            if (a.status === "pending") {
                if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
                if (a.dueDate) return -1; // Specific date > No date
                if (b.dueDate) return 1;
            }

            // Default fallback
            return 0; // standard creation order (ID based roughly)
        });
    },
});

export const getTask = query({
    args: { taskId: v.id("tasks") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.taskId);
    },
});

// === MUTATIONS ===

export const create = mutation({
    args: {
        familyId: v.id("families"),
        userId: v.id("users"), // Explicitly pass user ID
        title: v.string(),
        description: v.optional(v.string()),
        type: v.union(v.literal("general"), v.literal("shopping"), v.literal("chore")),
        priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
        dueDate: v.optional(v.number()),
        recurrence: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))),
        assignedTo: v.optional(v.id("users")),
        tags: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const taskId = await ctx.db.insert("tasks", {
            familyId: args.familyId,
            createdBy: args.userId,
            status: "pending",
            title: args.title,
            description: args.description,
            type: args.type,
            priority: args.priority,
            dueDate: args.dueDate,
            recurrence: args.recurrence,
            assignedTo: args.assignedTo,
            tags: args.tags,
        });

        return taskId;
    },
});

export const update = mutation({
    args: {
        familyId: v.id("families"), // For authorization check
        taskId: v.id("tasks"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        status: v.optional(v.union(v.literal("pending"), v.literal("completed"))),
        type: v.optional(v.union(v.literal("general"), v.literal("shopping"), v.literal("chore"))),
        priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
        dueDate: v.optional(v.number()),
        recurrence: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))),
        assignedTo: v.optional(v.id("users")),
        tags: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const { taskId, familyId, ...updates } = args;

        const task = await ctx.db.get(taskId);
        if (!task) throw new Error("Task not found");
        if (task.familyId !== familyId) throw new Error("Unauthorized: Task does not belong to this family.");

        await ctx.db.patch(taskId, updates);
    },
});

export const toggleStatus = mutation({
    args: {
        familyId: v.id("families"), // For authorization check
        taskId: v.id("tasks")
    },
    handler: async (ctx, args) => {
        const task = await ctx.db.get(args.taskId);
        if (!task) throw new Error("Task not found");
        if (task.familyId !== args.familyId) throw new Error("Unauthorized: Task does not belong to this family.");

        const newStatus = task.status === "pending" ? "completed" : "pending";
        await ctx.db.patch(args.taskId, { status: newStatus });
    },
});

export const delete_task = mutation({
    args: {
        familyId: v.id("families"), // For authorization check
        taskId: v.id("tasks")
    },
    handler: async (ctx, args) => {
        const task = await ctx.db.get(args.taskId);
        if (!task) throw new Error("Task not found");
        if (task.familyId !== args.familyId) throw new Error("Unauthorized: Task does not belong to this family.");

        await ctx.db.delete(args.taskId);
    },
});
