import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contacts")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();
  },
});

export const createContact = mutation({
  args: {
    familyId: v.id("families"),
    name: v.string(),
    category: CATEGORY_TYPE,
    specialty: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
    addedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("contacts", {
      ...args,
      isFavorite: false,
    });
  },
});

export const updateContact = mutation({
  args: {
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
    const { contactId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    return await ctx.db.patch(contactId, filteredUpdates);
  },
});

export const toggleFavorite = mutation({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw new Error("Contact not found");
    return await ctx.db.patch(args.contactId, {
      isFavorite: !contact.isFavorite,
    });
  },
});

export const deleteContact = mutation({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.contactId);
  },
});

export const getContactSummary = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
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
