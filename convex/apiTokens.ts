import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import {
  generateRandomToken,
  requireFamilyAccessFromSession,
  requireFamilyMembership,
  requireUserFromSessionToken,
  sha256Hex,
} from "./lib/auth";

export const API_TOKEN_PREFIX = "kovan_";
const TOKEN_PREFIX_DISPLAY_LENGTH = 14; // "kovan_" + 8 chars
const MAX_ACTIVE_TOKENS_PER_USER = 10;
// Las sesiones efímeras existen solo durante una tool call del MCP y se
// eliminan al terminar; el TTL es un respaldo por si la limpieza falla.
const MCP_SESSION_DURATION_MS = 1000 * 60 * 10;

// ==================== GESTIÓN DESDE LA APP (sessionToken) ====================

export const createApiToken = mutation({
  args: {
    sessionToken: v.string(),
    familyId: v.id("families"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);

    const name = args.name.trim();
    if (!name) {
      throw new Error("El nombre de la llave es requerido");
    }
    if (name.length > 60) {
      throw new Error("El nombre de la llave no puede exceder 60 caracteres");
    }

    const existing = await ctx.db
      .query("apiTokens")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const activeCount = existing.filter((t) => !t.revokedAt).length;
    if (activeCount >= MAX_ACTIVE_TOKENS_PER_USER) {
      throw new Error(
        `Alcanzaste el límite de ${MAX_ACTIVE_TOKENS_PER_USER} llaves activas. Revoca alguna antes de crear otra.`
      );
    }

    const rawToken = `${API_TOKEN_PREFIX}${generateRandomToken(24)}`;
    const tokenHash = await sha256Hex(rawToken);
    const tokenPrefix = rawToken.slice(0, TOKEN_PREFIX_DISPLAY_LENGTH);

    const tokenId = await ctx.db.insert("apiTokens", {
      userId: user._id,
      familyId: args.familyId,
      name,
      tokenHash,
      tokenPrefix,
      createdAt: Date.now(),
    });

    // El token en claro solo viaja en esta respuesta; no se vuelve a mostrar.
    return { tokenId, token: rawToken, tokenPrefix };
  },
});

export const listApiTokens = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUserFromSessionToken(ctx, args.sessionToken);

    const tokens = await ctx.db
      .query("apiTokens")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return tokens
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((t) => ({
        _id: t._id,
        name: t.name,
        tokenPrefix: t.tokenPrefix,
        familyId: t.familyId,
        createdAt: t.createdAt,
        lastUsedAt: t.lastUsedAt,
        revokedAt: t.revokedAt,
      }));
  },
});

export const revokeApiToken = mutation({
  args: {
    sessionToken: v.string(),
    tokenId: v.id("apiTokens"),
  },
  handler: async (ctx, args) => {
    const user = await requireUserFromSessionToken(ctx, args.sessionToken);

    const token = await ctx.db.get(args.tokenId);
    if (!token || token.userId !== user._id) {
      throw new Error("Llave no encontrada");
    }
    if (token.revokedAt) {
      return;
    }

    await ctx.db.patch(args.tokenId, { revokedAt: Date.now() });
  },
});

// ==================== RESOLUCIÓN PARA EL ENDPOINT MCP ====================

/**
 * Valida un API token y devuelve su contexto (sin crear sesión).
 * Usado por métodos MCP que no ejecutan tools (initialize, tools/list, ping).
 */
export const validateApiToken = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const tokenHash = await sha256Hex(args.token);
    const apiToken = await ctx.db
      .query("apiTokens")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .first();

    if (!apiToken || apiToken.revokedAt) {
      return null;
    }

    const user = await ctx.db.get(apiToken.userId);
    if (!user) {
      return null;
    }

    try {
      await requireFamilyMembership(ctx, apiToken.familyId, apiToken.userId);
    } catch {
      return null;
    }

    return { userId: apiToken.userId, familyId: apiToken.familyId };
  },
});

/**
 * Valida un API token y emite una sesión efímera para ejecutar una tool.
 * Las tools existentes operan con sessionToken, así que el endpoint MCP
 * intercambia el API token por una sesión corta y la elimina al terminar
 * (ver clearMcpSession). Esto reutiliza toda la validación de acceso
 * por familia que ya existe en queries/mutations sin duplicarla.
 */
export const mintMcpSession = internalMutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const tokenHash = await sha256Hex(args.token);
    const apiToken = await ctx.db
      .query("apiTokens")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .first();

    if (!apiToken || apiToken.revokedAt) {
      return null;
    }

    const user = await ctx.db.get(apiToken.userId);
    if (!user) {
      return null;
    }

    try {
      await requireFamilyMembership(ctx, apiToken.familyId, apiToken.userId);
    } catch {
      return null;
    }

    const now = Date.now();
    const rawSessionToken = generateRandomToken(32);
    // kind/familyId acotan la sesión a la familia de la API key: una sesión
    // MCP nunca debe ser más poderosa que la llave que la originó.
    await ctx.db.insert("sessions", {
      userId: apiToken.userId,
      tokenHash: await sha256Hex(rawSessionToken),
      createdAt: now,
      expiresAt: now + MCP_SESSION_DURATION_MS,
      kind: "mcp",
      familyId: apiToken.familyId,
    });

    await ctx.db.patch(apiToken._id, { lastUsedAt: now });

    return {
      sessionToken: rawSessionToken,
      userId: apiToken.userId,
      familyId: apiToken.familyId,
    };
  },
});

export const clearMcpSession = internalMutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const tokenHash = await sha256Hex(args.sessionToken);
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .first();
    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});
