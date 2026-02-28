import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireFamilyAccessFromSession, requireUserFromSessionToken } from "./lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getContactWithAccessOrThrow(ctx: any, sessionToken: string, contactId: any) {
  const contact = await ctx.db.get(contactId);
  if (!contact) throw new Error("Contacto no encontrado");
  await requireFamilyAccessFromSession(ctx, sessionToken, contact.familyId);
  return contact;
}

const CATEGORY_TYPE = v.union(
  v.literal("doctor"),
  v.literal("veterinarian"),
  v.literal("mechanic"),
  v.literal("plumber"),
  v.literal("electrician"),
  v.literal("dentist"),
  v.literal("emergency"),
  v.literal("other")
);

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

export const createContact = mutation({
  args: {
    sessionToken: v.string(),
    familyId: v.id("families"),
    name: v.string(),
    category: CATEGORY_TYPE,
    specialty: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserFromSessionToken(ctx, args.sessionToken);
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const { sessionToken: _sessionToken, ...payload } = args;
    return await ctx.db.insert("contacts", {
      ...payload,
      addedBy: user._id,
      isFavorite: false,
    });
  },
});

export const updateContact = mutation({
  args: {
    sessionToken: v.string(),
    contactId: v.id("contacts"),
    name: v.optional(v.string()),
    category: v.optional(CATEGORY_TYPE),
    specialty: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getContactWithAccessOrThrow(ctx, args.sessionToken, args.contactId);
    const { contactId, sessionToken: _sessionToken, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    return await ctx.db.patch(contactId, filteredUpdates);
  },
});

export const toggleFavorite = mutation({
  args: { sessionToken: v.string(), contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const contact = await getContactWithAccessOrThrow(ctx, args.sessionToken, args.contactId);
    return await ctx.db.patch(args.contactId, {
      isFavorite: !contact.isFavorite,
    });
  },
});

export const deleteContact = mutation({
  args: { sessionToken: v.string(), contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    await getContactWithAccessOrThrow(ctx, args.sessionToken, args.contactId);
    return await ctx.db.delete(args.contactId);
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
