import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id, Doc } from "./_generated/dataModel";
import { requireFamilyAccessFromSession, requireUserFromSessionToken } from "./lib/auth";

async function getPresetWithAccessOrThrow(
  ctx: QueryCtx | MutationCtx,
  sessionToken: string,
  presetId: Id<"gamePresets">
): Promise<Doc<"gamePresets">> {
  const preset = await ctx.db.get(presetId);
  if (!preset) throw new Error("Preset no encontrado");
  await requireFamilyAccessFromSession(ctx, sessionToken, preset.familyId);
  return preset;
}

// ==================== GAME PRESETS ====================

/**
 * Crear un nuevo preset personalizado
 */
export const createPreset = mutation({
  args: {
    sessionToken: v.string(),
    familyId: v.id("families"),
    gameType: v.union(v.literal("roulette"), v.literal("headsup")),
    name: v.string(),
    items: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserFromSessionToken(ctx, args.sessionToken);
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);

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
    sessionToken: v.string(),
    familyId: v.id("families"),
    gameType: v.union(v.literal("roulette"), v.literal("headsup")),
  },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
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
    sessionToken: v.string(),
    presetId: v.id("gamePresets"),
  },
  handler: async (ctx, args) => {
    return await getPresetWithAccessOrThrow(ctx, args.sessionToken, args.presetId);
  },
});

/**
 * Actualizar un preset existente
 */
export const updatePreset = mutation({
  args: {
    sessionToken: v.string(),
    presetId: v.id("gamePresets"),
    name: v.optional(v.string()),
    items: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await getPresetWithAccessOrThrow(ctx, args.sessionToken, args.presetId);
    const { presetId, sessionToken: _sessionToken, ...updateData } = args;

    await ctx.db.patch(presetId, updateData);

    return presetId;
  },
});

/**
 * Eliminar un preset
 */
export const deletePreset = mutation({
  args: {
    sessionToken: v.string(),
    presetId: v.id("gamePresets"),
  },
  handler: async (ctx, args) => {
    await getPresetWithAccessOrThrow(ctx, args.sessionToken, args.presetId);

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
    sessionToken: v.string(),
    familyId: v.id("families"),
    gameType: v.union(v.literal("roulette"), v.literal("headsup")),
    presetId: v.optional(v.id("gamePresets")),
    winner: v.optional(v.string()),
    participants: v.array(v.string()),
    result: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserFromSessionToken(ctx, args.sessionToken);
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    if (args.presetId) {
      const preset = await getPresetWithAccessOrThrow(ctx, args.sessionToken, args.presetId);
      if (preset.familyId !== args.familyId) {
        throw new Error("Preset no pertenece a la familia");
      }
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
    sessionToken: v.string(),
    familyId: v.id("families"),
    gameType: v.union(v.literal("roulette"), v.literal("headsup")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
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
    sessionToken: v.string(),
    presetId: v.id("gamePresets"),
  },
  handler: async (ctx, args) => {
    await getPresetWithAccessOrThrow(ctx, args.sessionToken, args.presetId);
    const sessions = await ctx.db
      .query("gameSessions")
      .withIndex("by_preset", (q) => q.eq("presetId", args.presetId))
      .order("desc")
      .collect();

    return sessions;
  },
});
