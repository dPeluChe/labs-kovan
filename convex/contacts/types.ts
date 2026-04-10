import { v } from "convex/values";

export const CATEGORY_TYPE = v.union(
  v.literal("doctor"),
  v.literal("veterinarian"),
  v.literal("mechanic"),
  v.literal("plumber"),
  v.literal("electrician"),
  v.literal("dentist"),
  v.literal("emergency"),
  v.literal("other")
);
