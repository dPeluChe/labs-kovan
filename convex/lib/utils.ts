import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { requireFamilyAccessFromSession } from "./auth";

/**
 * Validates session token and family membership for query handlers.
 */
export async function getFamilyUser(
  ctx: QueryCtx,
  args: { sessionToken: string; familyId: Id<"families"> }
) {
  const { user, membership } = await requireFamilyAccessFromSession(
    ctx,
    args.sessionToken,
    args.familyId
  );

  const family = await ctx.db.get(args.familyId);
  if (!family) {
    throw new Error("Family not found");
  }

  return { user, family, familyMember: membership };
}

/**
 * Validates session token and family membership for mutation handlers.
 */
export async function getFamilyUserMutation(
  ctx: MutationCtx,
  args: { sessionToken: string; familyId: Id<"families"> }
) {
  const { user, membership } = await requireFamilyAccessFromSession(
    ctx,
    args.sessionToken,
    args.familyId
  );

  const family = await ctx.db.get(args.familyId);
  if (!family) {
    throw new Error("Family not found");
  }

  return { user, family, familyMember: membership };
}
