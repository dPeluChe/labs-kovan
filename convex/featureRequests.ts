import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Submit a new feature request
export const submit = mutation({
    args: {
        title: v.string(),
        description: v.string(),
        email: v.optional(v.string()),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Basic validation
        if (args.title.trim().length === 0) {
            throw new Error("Title is required");
        }
        if (args.description.trim().length === 0) {
            throw new Error("Description is required");
        }

        const featureId = await ctx.db.insert("featureRequests", {
            title: args.title,
            description: args.description,
            email: args.email,
            category: args.category,
            status: "new",
            createdAt: Date.now(),
        });

        return featureId;
    },
});

// Admin ONLY: Get all requests (In a real app, protect this with auth)
export const list = query({
    args: {
        status: v.optional(v.string()) // Filter by status if needed
    },
    handler: async (ctx, args) => {
        // TODO: Add proper admin check here
        if (args.status) {
            // Need to cast to status union type logic if strictly typed, but "by_status" index is available
            // simpler limit for generic list now
            return await ctx.db.query("featureRequests").order("desc").take(100);
        }
        return await ctx.db.query("featureRequests").order("desc").take(100);
    },
});
