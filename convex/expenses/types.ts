import { v } from "convex/values";

const EXPENSE_TYPE = v.union(
  v.literal("general"),
  v.literal("subscription"),
  v.literal("vehicle"),
  v.literal("gift"),
  v.literal("trip")
);

const CATEGORY_TYPE = v.union(
  v.literal("food"),
  v.literal("transport"),
  v.literal("entertainment"),
  v.literal("utilities"),
  v.literal("health"),
  v.literal("shopping"),
  v.literal("home"),
  v.literal("education"),
  v.literal("gifts"),
  v.literal("vehicle"),
  v.literal("subscription"),
  v.literal("trip"),
  v.literal("other")
);

export { EXPENSE_TYPE, CATEGORY_TYPE };
