/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as calendar from "../calendar.js";
import type * as contacts from "../contacts.js";
import type * as expenses from "../expenses.js";
import type * as families from "../families.js";
import type * as files from "../files.js";
import type * as gifts from "../gifts.js";
import type * as health from "../health.js";
import type * as lib_utils from "../lib/utils.js";
import type * as library from "../library.js";
import type * as places from "../places.js";
import type * as recipes from "../recipes.js";
import type * as services from "../services.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  calendar: typeof calendar;
  contacts: typeof contacts;
  expenses: typeof expenses;
  families: typeof families;
  files: typeof files;
  gifts: typeof gifts;
  health: typeof health;
  "lib/utils": typeof lib_utils;
  library: typeof library;
  places: typeof places;
  recipes: typeof recipes;
  services: typeof services;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
