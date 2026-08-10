/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as __tests___helpers from "../__tests__/helpers.js";
import type * as auth from "../auth.js";
import type * as badges from "../badges.js";
import type * as betActions from "../betActions.js";
import type * as bets from "../bets.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as leaderboards from "../leaderboards.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_prices from "../lib/prices.js";
import type * as lib_rating from "../lib/rating.js";
import type * as notifications from "../notifications.js";
import type * as points from "../points.js";
import type * as progression from "../progression.js";
import type * as resolution from "../resolution.js";
import type * as resolutionHelpers from "../resolutionHelpers.js";
import type * as rivalries from "../rivalries.js";
import type * as seed from "../seed.js";
import type * as tokens from "../tokens.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "__tests__/helpers": typeof __tests___helpers;
  auth: typeof auth;
  badges: typeof badges;
  betActions: typeof betActions;
  bets: typeof bets;
  crons: typeof crons;
  http: typeof http;
  leaderboards: typeof leaderboards;
  "lib/constants": typeof lib_constants;
  "lib/prices": typeof lib_prices;
  "lib/rating": typeof lib_rating;
  notifications: typeof notifications;
  points: typeof points;
  progression: typeof progression;
  resolution: typeof resolution;
  resolutionHelpers: typeof resolutionHelpers;
  rivalries: typeof rivalries;
  seed: typeof seed;
  tokens: typeof tokens;
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

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
