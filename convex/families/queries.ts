import { v } from "convex/values";
import { query } from "../_generated/server";
import {
  requireFamilyMembership,
  requireUserFromSessionToken,
  sha256Hex,
} from "../lib/auth";

export const getUserFamilies = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUserFromSessionToken(ctx, args.sessionToken);

    const memberships = await ctx.db
      .query("familyMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const families = await Promise.all(
      memberships.map(async (m) => {
        const family = await ctx.db.get(m.familyId);
        return family ? { ...family, role: m.role } : null;
      })
    );

    return families.filter(Boolean);
  },
});

export const getFamilyByInviteToken = query({
  args: { inviteToken: v.string() },
  handler: async (ctx, args) => {
    const tokenHash = await sha256Hex(args.inviteToken);
    const invite = await ctx.db
      .query("familyInvites")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .first();

    if (!invite || invite.status !== "pending" || invite.expiresAt < Date.now()) {
      return null;
    }

    const family = await ctx.db.get(invite.familyId);
    if (!family) return null;

    return {
      familyId: family._id,
      familyName: family.name,
      familyEmoji: family.emoji,
      invitedEmail: invite.email,
      expiresAt: invite.expiresAt,
    };
  },
});

export const getFamilyMembers = query({
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args) => {
    await requireUserFromSessionToken(ctx, args.sessionToken).then((user) =>
      requireFamilyMembership(ctx, args.familyId, user._id)
    );

    const memberships = await ctx.db
      .query("familyMembers")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();

    const members = await Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        if (!user) return null;
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          photoUrl: user.photoUrl,
          isSuperAdmin: user.isSuperAdmin,
          membershipId: m._id,
          role: m.role,
          status: m.status,
        };
      })
    );

    return members.filter(Boolean);
  },
});

export const getPendingInvites = query({
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args) => {
    const user = await requireUserFromSessionToken(ctx, args.sessionToken);
    const membership = await requireFamilyMembership(ctx, args.familyId, user._id);
    if (membership.role !== "owner" && membership.role !== "admin") {
      throw new Error("Solo owner/admin pueden ver invitaciones");
    }

    return await ctx.db
      .query("familyInvites")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "pending"),
          q.gt(q.field("expiresAt"), Date.now())
        )
      )
      .collect();
  },
});
