import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get conversation history for a user
export const getConversationHistory = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("agentConversations")
            .withIndex("by_user_timestamp", (q) => q.eq("userId", args.userId))
            .order("desc")
            .take(50); // Last 50 messages
    },
});

// Save a message to conversation history
export const saveMessage = mutation({
    args: {
        userId: v.id("users"),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("agentConversations", {
            userId: args.userId,
            role: args.role,
            content: args.content,
            timestamp: Date.now(),
        });
    },
});

// Clear conversation history for a user
export const clearConversation = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("agentConversations")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        for (const message of messages) {
            await ctx.db.delete(message._id);
        }

        return { success: true, deleted: messages.length };
    },
});
