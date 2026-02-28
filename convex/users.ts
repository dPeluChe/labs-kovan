import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  createSession,
  deleteSessionByToken,
  generateSalt,
  hashPassword,
  normalizeEmail,
  requireUserFromSessionToken,
  sanitizeUser,
  verifyPassword,
} from "./lib/auth";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();

    return user;
  },
});

export const getOrCreateUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    photoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check if user exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      photoUrl: args.photoUrl,
      tokenIdentifier: identity.subject,
    });

    return userId;
  },
});

export const registerUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingUser?.passwordHash) {
      throw new Error("Ya existe una cuenta con ese correo");
    }

    const passwordSalt = generateSalt();
    const passwordHash = await hashPassword(args.password, passwordSalt);

    let userId = existingUser?._id;
    if (userId) {
      await ctx.db.patch(userId, {
        name: args.name.trim(),
        email,
        passwordHash,
        passwordSalt,
      });
    } else {
      userId = await ctx.db.insert("users", {
        name: args.name.trim(),
        email,
        passwordHash,
        passwordSalt,
      });
    }

    const sessionToken = await createSession(ctx, userId);
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("No se pudo crear la cuenta");

    return { user: sanitizeUser(user), sessionToken };
  },
});

export const loginUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throw new Error("No existe una cuenta con ese correo");
    }

    if (!user.passwordHash || !user.passwordSalt) {
      throw new Error("Tu cuenta no tiene contraseña configurada. Regístrala de nuevo.");
    }

    const isValid = await verifyPassword(args.password, user.passwordHash, user.passwordSalt);
    if (!isValid) {
      throw new Error("Contraseña incorrecta");
    }

    const sessionToken = await createSession(ctx, user._id);
    return { user: sanitizeUser(user), sessionToken };
  },
});

export const getSessionUser = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUserFromSessionToken(ctx, args.sessionToken);
    return sanitizeUser(user);
  },
});

export const logoutUser = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await deleteSessionByToken(ctx, args.sessionToken);
    return { success: true };
  },
});

export const updateUser = mutation({
  args: {
    sessionToken: v.string(),
    name: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserFromSessionToken(ctx, args.sessionToken);

    await ctx.db.patch(user._id, {
      ...(args.name && { name: args.name }),
      ...(args.photoUrl && { photoUrl: args.photoUrl }),
    });

    return user._id;
  },
});

export const updateNavOrder = mutation({
  args: {
    sessionToken: v.string(),
    navOrder: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserFromSessionToken(ctx, args.sessionToken);
    await ctx.db.patch(user._id, {
      navOrder: args.navOrder,
    });
    return args.navOrder;
  },
});

export const getNavOrder = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUserFromSessionToken(ctx, args.sessionToken);
    return user?.navOrder ?? null;
  },
});
