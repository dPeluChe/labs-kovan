import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getRecipes = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("recipes")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();
  },
});

export const getRecipe = query({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.recipeId);
  },
});

export const createRecipe = mutation({
  args: {
    familyId: v.id("families"),
    title: v.string(),
    url: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    notes: v.optional(v.string()),
    addedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("recipes", {
      ...args,
      isFavorite: false,
    });
  },
});

export const updateRecipe = mutation({
  args: {
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
    const { recipeId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    return await ctx.db.patch(recipeId, filteredUpdates);
  },
});

export const toggleFavorite = mutation({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) throw new Error("Recipe not found");
    return await ctx.db.patch(args.recipeId, {
      isFavorite: !recipe.isFavorite,
    });
  },
});

export const deleteRecipe = mutation({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.recipeId);
  },
});

export const getRecipeSummary = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
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
