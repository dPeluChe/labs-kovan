import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserFromSessionToken } from "./lib/auth";

// Get conversation history for a user
export const getConversationHistory = query({
    args: { sessionToken: v.string() },
    handler: async (ctx, args) => {
        const user = await requireUserFromSessionToken(ctx, args.sessionToken);
        return await ctx.db
            .query("agentConversations")
            .withIndex("by_user_timestamp", (q) => q.eq("userId", user._id))
            .order("desc")
            .take(50); // Last 50 messages
    },
});

// Save a message to conversation history
export const saveMessage = mutation({
    args: {
        sessionToken: v.string(),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await requireUserFromSessionToken(ctx, args.sessionToken);
        return await ctx.db.insert("agentConversations", {
            userId: user._id,
            role: args.role,
            content: args.content,
            timestamp: Date.now(),
        });
    },
});

// Clear conversation history for a user
export const clearConversation = mutation({
    args: { sessionToken: v.string() },
    handler: async (ctx, args) => {
        const user = await requireUserFromSessionToken(ctx, args.sessionToken);
        const messages = await ctx.db
            .query("agentConversations")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        for (const message of messages) {
            await ctx.db.delete(message._id);
        }

        return { success: true, deleted: messages.length };
    },
});
