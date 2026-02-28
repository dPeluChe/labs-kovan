import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function generateRandomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

export function generateSalt(byteLength = 16): string {
  return generateRandomToken(byteLength);
}

export async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return toHex(new Uint8Array(digest));
}

export async function hashPassword(password: string, saltHex: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const saltBytes = Uint8Array.from(fromHex(saltHex));

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 120_000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  return toHex(new Uint8Array(bits));
}

export async function verifyPassword(
  password: string,
  expectedHash: string,
  saltHex: string
): Promise<boolean> {
  const computed = await hashPassword(password, saltHex);
  return computed === expectedHash;
}

type Ctx = QueryCtx | MutationCtx;

export async function createSession(ctx: MutationCtx, userId: Id<"users">) {
  const rawToken = generateRandomToken(32);
  const tokenHash = await sha256Hex(rawToken);
  const now = Date.now();
  const expiresAt = now + SESSION_DURATION_MS;

  await ctx.db.insert("sessions", {
    userId,
    tokenHash,
    createdAt: now,
    expiresAt,
  });

  return rawToken;
}

export async function getUserFromSessionToken(
  ctx: Ctx,
  sessionToken: string
): Promise<Doc<"users"> | null> {
  const tokenHash = await sha256Hex(sessionToken);
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
    .first();

  if (!session) {
    return null;
  }

  if (session.expiresAt < Date.now()) {
    if ("delete" in ctx.db) {
      await ctx.db.delete(session._id);
    }
    return null;
  }

  return await ctx.db.get(session.userId);
}

export async function requireUserFromSessionToken(
  ctx: Ctx,
  sessionToken: string
): Promise<Doc<"users">> {
  const user = await getUserFromSessionToken(ctx, sessionToken);
  if (!user) {
    throw new Error("Sesión inválida o expirada");
  }
  return user;
}

export async function deleteSessionByToken(ctx: MutationCtx, sessionToken: string) {
  const tokenHash = await sha256Hex(sessionToken);
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
    .first();

  if (session) {
    await ctx.db.delete(session._id);
  }
}

export function sanitizeUser(user: Doc<"users">) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    photoUrl: user.photoUrl,
    isSuperAdmin: user.isSuperAdmin,
    navOrder: user.navOrder,
  };
}

export async function requireFamilyMembership(
  ctx: Ctx,
  familyId: Id<"families">,
  userId: Id<"users">
) {
  const membership = await ctx.db
    .query("familyMembers")
    .withIndex("by_family_user", (q) => q.eq("familyId", familyId).eq("userId", userId))
    .first();

  if (!membership || membership.status !== "active") {
    throw new Error("No tienes acceso a esta familia");
  }

  return membership;
}

export async function requireFamilyAccessFromSession(
  ctx: Ctx,
  sessionToken: string,
  familyId: Id<"families">
) {
  const user = await requireUserFromSessionToken(ctx, sessionToken);
  const membership = await requireFamilyMembership(ctx, familyId, user._id);
  return { user, membership };
}
