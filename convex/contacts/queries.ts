import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireFamilyAccessFromSession } from "../lib/auth";

export const getContacts = query({
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    return await ctx.db
      .query("contacts")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();
  },
});

export const getContactSummary = query({
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();

    const byCategory: Record<string, number> = {};
    let favorites = 0;

    for (const contact of contacts) {
      byCategory[contact.category] = (byCategory[contact.category] || 0) + 1;
      if (contact.isFavorite) favorites++;
    }

    return {
      total: contacts.length,
      favorites,
      byCategory,
    };
  },
});
