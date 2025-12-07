import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getUserFamilies = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("familyMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
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

export const getFamily = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.familyId);
  },
});

export const getFamilyMembers = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("familyMembers")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();

    const members = await Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return user
          ? {
              ...user,
              membershipId: m._id,
              role: m.role,
              status: m.status,
            }
          : null;
      })
    );

    return members.filter(Boolean);
  },
});

export const createFamily = mutation({
  args: {
    name: v.string(),
    emoji: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const familyId = await ctx.db.insert("families", {
      name: args.name,
      emoji: args.emoji,
    });

    // Add creator as owner
    await ctx.db.insert("familyMembers", {
      familyId,
      userId: args.userId,
      role: "owner",
      status: "active",
    });

    return familyId;
  },
});

export const updateFamily = mutation({
  args: {
    familyId: v.id("families"),
    name: v.optional(v.string()),
    emoji: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { familyId, ...updates } = args;
    await ctx.db.patch(familyId, updates);
    return familyId;
  },
});

export const inviteMember = mutation({
  args: {
    familyId: v.id("families"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("User not found with that email");
    }

    // Check if already a member
    const existing = await ctx.db
      .query("familyMembers")
      .withIndex("by_family_user", (q) =>
        q.eq("familyId", args.familyId).eq("userId", user._id)
      )
      .first();

    if (existing) {
      throw new Error("User is already a member of this family");
    }

    const membershipId = await ctx.db.insert("familyMembers", {
      familyId: args.familyId,
      userId: user._id,
      role: args.role,
      status: "invited",
    });

    return membershipId;
  },
});

export const acceptInvite = mutation({
  args: { membershipId: v.id("familyMembers") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.membershipId, { status: "active" });
    return args.membershipId;
  },
});

export const removeMember = mutation({
  args: { membershipId: v.id("familyMembers") },
  handler: async (ctx, args) => {
    const membership = await ctx.db.get(args.membershipId);
    if (!membership) throw new Error("Membership not found");
    if (membership.role === "owner") {
      throw new Error("Cannot remove the owner");
    }
    await ctx.db.delete(args.membershipId);
  },
});

export const updateMemberRole = mutation({
  args: {
    membershipId: v.id("familyMembers"),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db.get(args.membershipId);
    if (!membership) throw new Error("Membership not found");
    if (membership.role === "owner") {
      throw new Error("Cannot change owner role");
    }
    await ctx.db.patch(args.membershipId, { role: args.role });
  },
});

// ==================== FAMILY INVITES ====================
export const sendInvite = mutation({
  args: {
    familyId: v.id("families"),
    email: v.string(),
    invitedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      // Check if already a member
      const existingMember = await ctx.db
        .query("familyMembers")
        .withIndex("by_family_user", (q) =>
          q.eq("familyId", args.familyId).eq("userId", existingUser._id)
        )
        .first();

      if (existingMember) {
        throw new Error("Este usuario ya es miembro de la familia");
      }

      // Add directly as member
      await ctx.db.insert("familyMembers", {
        familyId: args.familyId,
        userId: existingUser._id,
        role: "member",
        status: "active",
      });

      return { added: true, userId: existingUser._id };
    }

    // Create pending invite
    const existingInvite = await ctx.db
      .query("familyInvites")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) =>
        q.and(
          q.eq(q.field("familyId"), args.familyId),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();

    if (existingInvite) {
      throw new Error("Ya hay una invitación pendiente para este email");
    }

    const inviteId = await ctx.db.insert("familyInvites", {
      familyId: args.familyId,
      email: args.email,
      invitedBy: args.invitedBy,
      status: "pending",
      createdAt: Date.now(),
    });

    return { added: false, inviteId };
  },
});

export const getPendingInvites = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("familyInvites")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
  },
});

export const getMyInvites = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const invites = await ctx.db
      .query("familyInvites")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const withFamilies = await Promise.all(
      invites.map(async (invite) => {
        const family = await ctx.db.get(invite.familyId);
        return { ...invite, family };
      })
    );

    return withFamilies;
  },
});

export const acceptFamilyInvite = mutation({
  args: { inviteId: v.id("familyInvites"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("Invitación no encontrada");
    if (invite.status !== "pending") throw new Error("Invitación ya procesada");

    // Add as member
    await ctx.db.insert("familyMembers", {
      familyId: invite.familyId,
      userId: args.userId,
      role: "member",
      status: "active",
    });

    // Mark invite as accepted
    await ctx.db.patch(args.inviteId, { status: "accepted" });

    return invite.familyId;
  },
});

export const cancelInvite = mutation({
  args: { inviteId: v.id("familyInvites") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.inviteId);
  },
});

// Join family by ID (for invite links) - validates pending invite by email
export const joinFamilyById = mutation({
  args: { 
    familyId: v.id("families"), 
    userId: v.id("users") 
  },
  handler: async (ctx, args) => {
    // Check if family exists
    const family = await ctx.db.get(args.familyId);
    if (!family) throw new Error("Familia no encontrada");

    // Get user to check email
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Usuario no encontrado");

    // Check if already a member
    const existingMember = await ctx.db
      .query("familyMembers")
      .withIndex("by_family_user", (q) =>
        q.eq("familyId", args.familyId).eq("userId", args.userId)
      )
      .first();

    if (existingMember) {
      // Already a member, just return the family
      return { familyId: args.familyId, alreadyMember: true, success: true };
    }

    // Check if there's a pending invite for this email
    const pendingInvite = await ctx.db
      .query("familyInvites")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .filter((q) =>
        q.and(
          q.eq(q.field("familyId"), args.familyId),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();

    if (!pendingInvite) {
      // No valid invite found - reject
      throw new Error("No tienes una invitación válida para esta familia. Pide que te inviten usando tu email.");
    }

    // Valid invite found - add as member
    await ctx.db.insert("familyMembers", {
      familyId: args.familyId,
      userId: args.userId,
      role: "member",
      status: "active",
    });

    // Mark invite as accepted
    await ctx.db.patch(pendingInvite._id, { status: "accepted" });

    return { familyId: args.familyId, alreadyMember: false, success: true };
  },
});
