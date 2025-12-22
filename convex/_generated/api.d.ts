/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agent from "../agent.js";
import type * as agentConversations from "../agentConversations.js";
import type * as calendar from "../calendar.js";
import type * as cloudinary from "../cloudinary.js";
import type * as collections from "../collections.js";
import type * as contacts from "../contacts.js";
import type * as documents from "../documents.js";
import type * as expenses from "../expenses.js";
import type * as families from "../families.js";
import type * as featureRequests from "../featureRequests.js";
import type * as files from "../files.js";
import type * as games from "../games.js";
import type * as gifts from "../gifts.js";
import type * as health from "../health.js";
import type * as lib_agent_fuzzyMatch from "../lib/agent/fuzzyMatch.js";
import type * as lib_agent_index from "../lib/agent/index.js";
import type * as lib_utils from "../lib/utils.js";
import type * as loans from "../loans.js";
import type * as petNutrition from "../petNutrition.js";
import type * as places from "../places.js";
import type * as recipes from "../recipes.js";
import type * as subscriptions from "../subscriptions.js";
import type * as tasks from "../tasks.js";
import type * as trips from "../trips.js";
import type * as users from "../users.js";
import type * as vehicles from "../vehicles.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agent: typeof agent;
  agentConversations: typeof agentConversations;
  calendar: typeof calendar;
  cloudinary: typeof cloudinary;
  collections: typeof collections;
  contacts: typeof contacts;
  documents: typeof documents;
  expenses: typeof expenses;
  families: typeof families;
  featureRequests: typeof featureRequests;
  files: typeof files;
  games: typeof games;
  gifts: typeof gifts;
  health: typeof health;
  "lib/agent/fuzzyMatch": typeof lib_agent_fuzzyMatch;
  "lib/agent/index": typeof lib_agent_index;
  "lib/utils": typeof lib_utils;
  loans: typeof loans;
  petNutrition: typeof petNutrition;
  places: typeof places;
  recipes: typeof recipes;
  subscriptions: typeof subscriptions;
  tasks: typeof tasks;
  trips: typeof trips;
  users: typeof users;
  vehicles: typeof vehicles;
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
