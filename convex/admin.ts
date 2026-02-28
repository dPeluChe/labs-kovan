import { query, mutation } from "./_generated/server";
import { type DatabaseReader } from "./_generated/server";
import { v } from "convex/values";
import { type Id } from "./_generated/dataModel";
import { requireUserFromSessionToken } from "./lib/auth";

// Helper to check admin permission
async function checkSuperAdmin(ctx: { db: DatabaseReader }, userId: Id<"users">) {
    const user = await ctx.db.get(userId);
    if (!user || !user.isSuperAdmin) {
        throw new Error("Unauthorized - SuperAdmin access required");
    }
    return user;
}

// Get system stats for superadmin
export const getStats = query({
    args: { sessionToken: v.string() },
    handler: async (ctx, args) => {
        const user = await requireUserFromSessionToken(ctx, args.sessionToken);
        await checkSuperAdmin(ctx, user._id);

        // Families
        const families = await ctx.db.query("families").collect();
        const users = await ctx.db.query("users").collect();
        const invites = await ctx.db.query("familyInvites").collect();

        // Some aggregate stats
        const totalFamilies = families.length;
        const totalUsers = users.length;
        const totalInvites = invites.length;
        const pendingInvites = invites.filter(i => i.status === "pending").length;

        // Recent families
        const recentFamilies = families.slice(-5).reverse();

        return {
            totalFamilies,
            totalUsers,
            totalInvites,
            pendingInvites,
            recentFamilies,
        };
    },
});

// Get all users (limited for demo)
export const getUsers = query({
    args: { sessionToken: v.string() },
    handler: async (ctx, args) => {
        const user = await requireUserFromSessionToken(ctx, args.sessionToken);
        await checkSuperAdmin(ctx, user._id);
        return await ctx.db.query("users").order("desc").take(100);
    },
});

// Delete a user
export const deleteUser = mutation({
    args: {
        sessionToken: v.string(),
        targetUserId: v.id("users") // The user to delete
    },
    handler: async (ctx, args) => {
        const user = await requireUserFromSessionToken(ctx, args.sessionToken);
        await checkSuperAdmin(ctx, user._id);

        // Prevent self-deletion
        if (user._id === args.targetUserId) {
            throw new Error("Cannot delete yourself");
        }

        // Delete user
        await ctx.db.delete(args.targetUserId);

        // Also clean up their family memberships? 
        // Ideally yes, but for now just the user record is fine for demo purposes.
        // It might leave "orphan" references in families but Convex handles that gracefully usually strictly speaking but for demo it's fine.
        // Or we can delete memberships where they are.

        const memberships = await ctx.db
            .query("familyMembers")
            .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
            .collect();

        for (const membership of memberships) {
            await ctx.db.delete(membership._id);
        }
    },
});
