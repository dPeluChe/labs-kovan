import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==================== GAME PRESETS ====================

/**
 * Crear un nuevo preset personalizado
 */
export const createPreset = mutation({
  args: {
    familyId: v.id("families"),
    gameType: v.union(v.literal("roulette"), v.literal("headsup")),
    name: v.string(),
    items: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const presetId = await ctx.db.insert("gamePresets", {
      familyId: args.familyId,
      gameType: args.gameType,
      name: args.name,
      items: args.items,
      isDefault: false,
      createdBy: user._id,
    });

    return presetId;
  },
});

/**
 * Obtener presets de una familia por tipo de juego
 */
export const getPresets = query({
  args: {
    familyId: v.id("families"),
    gameType: v.union(v.literal("roulette"), v.literal("headsup")),
  },
  handler: async (ctx, args) => {
    const presets = await ctx.db
      .query("gamePresets")
      .withIndex("by_family_game", (q) =>
        q.eq("familyId", args.familyId).eq("gameType", args.gameType)
      )
      .collect();

    return presets;
  },
});

/**
 * Obtener un preset por ID
 */
export const getPreset = query({
  args: {
    presetId: v.id("gamePresets"),
  },
  handler: async (ctx, args) => {
    const preset = await ctx.db.get(args.presetId);
    return preset;
  },
});

/**
 * Actualizar un preset existente
 */
export const updatePreset = mutation({
  args: {
    presetId: v.id("gamePresets"),
    name: v.optional(v.string()),
    items: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const preset = await ctx.db.get(args.presetId);
    if (!preset) {
      throw new Error("Preset not found");
    }

    const { presetId, ...updateData } = args;

    await ctx.db.patch(presetId, updateData);

    return presetId;
  },
});

/**
 * Eliminar un preset
 */
export const deletePreset = mutation({
  args: {
    presetId: v.id("gamePresets"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.presetId);

    return { success: true };
  },
});

// ==================== GAME SESSIONS ====================

/**
 * Guardar una sesión de juego terminada
 */
export const saveSession = mutation({
  args: {
    familyId: v.id("families"),
    gameType: v.union(v.literal("roulette"), v.literal("headsup")),
    presetId: v.optional(v.id("gamePresets")),
    winner: v.optional(v.string()),
    participants: v.array(v.string()),
    result: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const sessionId = await ctx.db.insert("gameSessions", {
      familyId: args.familyId,
      gameType: args.gameType,
      presetId: args.presetId,
      winner: args.winner,
      participants: args.participants,
      result: args.result,
      playedAt: Date.now(),
      playedBy: user._id,
    });

    return sessionId;
  },
});

/**
 * Obtener historial de sesiones de una familia
 */
export const getSessions = query({
  args: {
    familyId: v.id("families"),
    gameType: v.union(v.literal("roulette"), v.literal("headsup")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("gameSessions")
      .withIndex("by_family_type", (q) =>
        q.eq("familyId", args.familyId).eq("gameType", args.gameType)
      )
      .order("desc")
      .take(args.limit ?? 20);

    return sessions;
  },
});

/**
 * Obtener sesiones por preset
 */
export const getSessionsByPreset = query({
  args: {
    presetId: v.id("gamePresets"),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("gameSessions")
      .withIndex("by_preset", (q) => q.eq("presetId", args.presetId))
      .order("desc")
      .collect();

    return sessions;
  },
});
