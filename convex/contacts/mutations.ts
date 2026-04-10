import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireFamilyAccessFromSession, requireUserFromSessionToken } from "../lib/auth";
import { getContactWithAccessOrThrow } from "./access";
import { CATEGORY_TYPE } from "./types";

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
