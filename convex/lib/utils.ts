import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/**
 * Validates the authenticated user and their family membership.
 * Use inside query handlers.
 * @throws ConvexError if not authenticated or not a family member.
 */
export async function getFamilyUser(
  ctx: QueryCtx,
  args: { familyId: Id<"families"> }
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Not authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .first();

  if (!user) {
    throw new ConvexError("User not found");
  }

  const family = await ctx.db.get(args.familyId);
  if (!family) {
    throw new ConvexError("Family not found");
  }

  const familyMember = await ctx.db
    .query("familyMembers")
    .withIndex("by_family_user", (q) =>
      q.eq("familyId", args.familyId).eq("userId", user._id)
    )
    .first();

  if (!familyMember) {
    throw new ConvexError("Not a member of this family");
  }

  return { user, family, familyMember };
}

/**
 * Validates the authenticated user and their family membership.
 * Use inside mutation handlers.
 * @throws ConvexError if not authenticated or not a family member.
 */
export async function getFamilyUserMutation(
  ctx: MutationCtx,
  args: { familyId: Id<"families"> }
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Not authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .first();

  if (!user) {
    throw new ConvexError("User not found");
  }

  const family = await ctx.db.get(args.familyId);
  if (!family) {
    throw new ConvexError("Family not found");
  }

  const familyMember = await ctx.db
    .query("familyMembers")
    .withIndex("by_family_user", (q) =>
      q.eq("familyId", args.familyId).eq("userId", user._id)
    )
    .first();

  if (!familyMember) {
    throw new ConvexError("Not a member of this family");
  }

  return { user, family, familyMember };
}
