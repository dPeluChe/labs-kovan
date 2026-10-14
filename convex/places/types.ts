import { v } from "convex/values";

export const PLACE_CATEGORY = v.union(
  v.literal("restaurant"),
  v.literal("cafe"),
  v.literal("travel"),
  v.literal("activity"),
  v.literal("other")
);
