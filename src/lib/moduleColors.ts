/**
 * Central registry for module/feature colors.
 *
 * Kovan uses distinct colors to identify each feature module visually (the "Hogar"
 * gamification feature is yellow, "Finanzas" is emerald, etc). Since DaisyUI theme
 * tokens only expose ~5 semantic colors (primary/secondary/accent/success/warning/
 * error/info), we reach into the Tailwind palette for the rest.
 *
 * IMPORTANT: do NOT duplicate these strings across MorePage, BottomNav,
 * DashboardPage, etc. Always import from this file so that renaming a module
 * color only touches one place.
 *
 * Each entry returns a className that applies:
 *   - `bg-{color}-500/10`   → subtle tinted background
 *   - `text-{color}-600`    → readable foreground on that background
 *
 * Both classes are returned together so icon badges look consistent across
 * views (navigation, dashboard, more page, agent chips, etc.).
 */

export type ModuleColorKey =
  | "agent"
  | "household"
  | "finances"
  | "calendar"
  | "tasks"
  | "documents"
  | "subscriptions"
  | "health"
  | "pets"
  | "recipes"
  | "nutrition"
  | "places"
  | "trips"
  | "collections"
  | "activities"
  | "vehicles"
  | "contacts"
  | "diary"
  | "family"
  | "settings"
  | "gifts"
  | "gray";

export const MODULE_COLORS: Record<ModuleColorKey, string> = {
  agent:         "bg-purple-500/10 text-purple-600",
  household:     "bg-yellow-500/10 text-yellow-600",
  finances:      "bg-emerald-500/10 text-emerald-600",
  calendar:      "bg-orange-500/10 text-orange-600",
  tasks:         "bg-sky-500/10 text-sky-600",
  documents:     "bg-slate-500/10 text-slate-600",
  subscriptions: "bg-violet-500/10 text-violet-600",
  health:        "bg-pink-500/10 text-pink-600",
  pets:          "bg-orange-500/10 text-orange-600",
  recipes:       "bg-amber-500/10 text-amber-600",
  nutrition:     "bg-lime-500/10 text-lime-600",
  places:        "bg-rose-500/10 text-rose-600",
  trips:         "bg-cyan-500/10 text-cyan-600",
  collections:   "bg-blue-500/10 text-blue-600",
  activities:    "bg-purple-500/10 text-purple-600",
  vehicles:      "bg-green-500/10 text-green-600",
  contacts:      "bg-indigo-500/10 text-indigo-600",
  diary:         "bg-rose-500/10 text-rose-600",
  family:        "bg-purple-500/10 text-purple-600",
  settings:      "bg-gray-500/10 text-gray-600",
  gifts:         "bg-pink-500/10 text-pink-600",
  gray:          "bg-gray-500/10 text-gray-600",
};

/**
 * Small helper so callers can do `moduleColor("finances")` instead of
 * reaching into the map with a string index.
 */
export function moduleColor(key: ModuleColorKey): string {
  return MODULE_COLORS[key];
}
