import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireFamilyAccessFromSession, requireUserFromSessionToken } from "./lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getRecipeWithAccessOrThrow(ctx: any, sessionToken: string, recipeId: any) {
  const recipe = await ctx.db.get(recipeId);
  if (!recipe) throw new Error("Receta no encontrada");
  await requireFamilyAccessFromSession(ctx, sessionToken, recipe.familyId);
  return recipe;
}

export const getRecipes = query({
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    return await ctx.db
      .query("recipes")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();
  },
});

export const getRecipe = query({
  args: { sessionToken: v.string(), recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    return await getRecipeWithAccessOrThrow(ctx, args.sessionToken, args.recipeId);
  },
});

export const createRecipe = mutation({
  args: {
    sessionToken: v.string(),
    familyId: v.id("families"),
    title: v.string(),
    url: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserFromSessionToken(ctx, args.sessionToken);
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const { sessionToken: _sessionToken, ...payload } = args;
    return await ctx.db.insert("recipes", {
      ...payload,
      addedBy: user._id,
      isFavorite: false,
    });
  },
});

export const updateRecipe = mutation({
  args: {
    sessionToken: v.string(),
    recipeId: v.id("recipes"),
    title: v.optional(v.string()),
    url: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    isFavorite: v.optional(v.boolean()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getRecipeWithAccessOrThrow(ctx, args.sessionToken, args.recipeId);
    const { recipeId, sessionToken: _sessionToken, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    return await ctx.db.patch(recipeId, filteredUpdates);
  },
});

export const toggleFavorite = mutation({
  args: { sessionToken: v.string(), recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    const recipe = await getRecipeWithAccessOrThrow(ctx, args.sessionToken, args.recipeId);
    return await ctx.db.patch(args.recipeId, {
      isFavorite: !recipe.isFavorite,
    });
  },
});

export const deleteRecipe = mutation({
  args: { sessionToken: v.string(), recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    await getRecipeWithAccessOrThrow(ctx, args.sessionToken, args.recipeId);
    return await ctx.db.delete(args.recipeId);
  },
});

export const getRecipeSummary = query({
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const recipes = await ctx.db
      .query("recipes")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();

    return {
      total: recipes.length,
      favorites: recipes.filter((r) => r.isFavorite).length,
    };
  },
});
