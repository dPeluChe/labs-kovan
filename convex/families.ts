import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  generateRandomToken,
  normalizeEmail,
  requireFamilyMembership,
  requireUserFromSessionToken,
  sha256Hex,
} from "./lib/auth";

const INVITE_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

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

export const createFamily = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    emoji: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserFromSessionToken(ctx, args.sessionToken);
    const familyId = await ctx.db.insert("families", {
      name: args.name.trim(),
      emoji: args.emoji,
      imageUrl: args.imageUrl,
    });

    await ctx.db.insert("familyMembers", {
      familyId,
      userId: user._id,
      role: "owner",
      status: "active",
    });

    return familyId;
  },
});

export const updateFamily = mutation({
  args: {
    sessionToken: v.string(),
    familyId: v.id("families"),
    name: v.optional(v.string()),
    emoji: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserFromSessionToken(ctx, args.sessionToken);
    const membership = await requireFamilyMembership(ctx, args.familyId, user._id);
    if (membership.role !== "owner" && membership.role !== "admin") {
      throw new Error("Solo owner/admin pueden editar la familia");
    }

    const { familyId, sessionToken: _sessionToken, ...updates } = args;
    await ctx.db.patch(familyId, updates);
    return familyId;
  },
});

export const sendInvite = mutation({
  args: {
    sessionToken: v.string(),
    familyId: v.id("families"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requireUserFromSessionToken(ctx, args.sessionToken);
    const membership = await requireFamilyMembership(ctx, args.familyId, actor._id);
    if (membership.role !== "owner" && membership.role !== "admin") {
      throw new Error("Solo owner/admin pueden invitar miembros");
    }

    const inviteEmail = normalizeEmail(args.email);
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", inviteEmail))
      .first();

    if (existingUser) {
      const existingMember = await ctx.db
        .query("familyMembers")
        .withIndex("by_family_user", (q) => q.eq("familyId", args.familyId).eq("userId", existingUser._id))
        .first();
      if (existingMember && existingMember.status === "active") {
        throw new Error("Ese usuario ya es miembro activo de la familia");
      }
    }

    const currentPending = await ctx.db
      .query("familyInvites")
      .withIndex("by_email", (q) => q.eq("email", inviteEmail))
      .filter((q) =>
        q.and(q.eq(q.field("familyId"), args.familyId), q.eq(q.field("status"), "pending"))
      )
      .collect();

    for (const invite of currentPending) {
      if (invite.expiresAt < Date.now()) {
        await ctx.db.patch(invite._id, { status: "declined" });
      } else {
        throw new Error("Ya existe una invitación pendiente para ese correo");
      }
    }

    const rawInviteToken = generateRandomToken(32);
    const tokenHash = await sha256Hex(rawInviteToken);
    const now = Date.now();

    const inviteId = await ctx.db.insert("familyInvites", {
      familyId: args.familyId,
      email: inviteEmail,
      tokenHash,
      invitedBy: actor._id,
      status: "pending",
      createdAt: now,
      expiresAt: now + INVITE_DURATION_MS,
    });

    return {
      inviteId,
      inviteToken: rawInviteToken,
      expiresAt: now + INVITE_DURATION_MS,
    };
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
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
  },
});

export const joinFamilyByToken = mutation({
  args: {
    sessionToken: v.string(),
    inviteToken: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUserFromSessionToken(ctx, args.sessionToken);
    const normalizedEmail = normalizeEmail(args.email);

    if (normalizeEmail(user.email) !== normalizedEmail) {
      throw new Error("El correo no coincide con la cuenta activa");
    }

    const tokenHash = await sha256Hex(args.inviteToken);
    const invite = await ctx.db
      .query("familyInvites")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .first();

    if (!invite) {
      throw new Error("Invitación inválida");
    }
    if (invite.status !== "pending") {
      throw new Error("La invitación ya fue usada");
    }
    if (invite.expiresAt < Date.now()) {
      await ctx.db.patch(invite._id, { status: "declined" });
      throw new Error("La invitación expiró");
    }
    if (normalizeEmail(invite.email) !== normalizedEmail) {
      throw new Error("La invitación fue emitida para otro correo");
    }

    const existingMember = await ctx.db
      .query("familyMembers")
      .withIndex("by_family_user", (q) => q.eq("familyId", invite.familyId).eq("userId", user._id))
      .first();

    if (existingMember) {
      if (existingMember.status !== "active") {
        await ctx.db.patch(existingMember._id, { status: "active" });
      }
    } else {
      await ctx.db.insert("familyMembers", {
        familyId: invite.familyId,
        userId: user._id,
        role: "member",
        status: "active",
      });
    }

    await ctx.db.patch(invite._id, { status: "accepted" });
    return { familyId: invite.familyId, success: true };
  },
});

export const cancelInvite = mutation({
  args: { sessionToken: v.string(), inviteId: v.id("familyInvites") },
  handler: async (ctx, args) => {
    const actor = await requireUserFromSessionToken(ctx, args.sessionToken);
    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("Invitación no encontrada");

    const membership = await requireFamilyMembership(ctx, invite.familyId, actor._id);
    if (membership.role !== "owner" && membership.role !== "admin") {
      throw new Error("No autorizado");
    }

    await ctx.db.delete(args.inviteId);
  },
});

export const removeMember = mutation({
  args: { sessionToken: v.string(), membershipId: v.id("familyMembers") },
  handler: async (ctx, args) => {
    const actor = await requireUserFromSessionToken(ctx, args.sessionToken);
    const targetMembership = await ctx.db.get(args.membershipId);
    if (!targetMembership) throw new Error("Membership not found");
    if (targetMembership.role === "owner") {
      throw new Error("No se puede eliminar al owner");
    }

    const actorMembership = await requireFamilyMembership(ctx, targetMembership.familyId, actor._id);
    if (actorMembership.role !== "owner") {
      throw new Error("Solo el owner puede eliminar miembros");
    }

    await ctx.db.delete(args.membershipId);
  },
});

export const updateMemberRole = mutation({
  args: {
    sessionToken: v.string(),
    membershipId: v.id("familyMembers"),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const actor = await requireUserFromSessionToken(ctx, args.sessionToken);
    const targetMembership = await ctx.db.get(args.membershipId);
    if (!targetMembership) throw new Error("Membership not found");
    if (targetMembership.role === "owner") {
      throw new Error("No se puede cambiar el rol del owner");
    }

    const actorMembership = await requireFamilyMembership(ctx, targetMembership.familyId, actor._id);
    if (actorMembership.role !== "owner") {
      throw new Error("Solo el owner puede cambiar roles");
    }

    await ctx.db.patch(args.membershipId, { role: args.role });
  },
});
