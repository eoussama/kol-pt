import type { TEntry } from "../schemas/entry/entry.schema";
import type { TPost } from "../schemas/post.schema";
import type { TPatreonColorMode } from "../theme/color-mode";
import type { IAuthUser } from "../types/auth-user.type";

import { storage } from "wxt/utils/storage";



/**
 * @description
 * A cached copy of a database collection.
 */
export interface ICached<T> {

  /**
   * @description
   * When the data was fetched, in epoch milliseconds.
   */
  updatedAt: number;

  /**
   * @description
   * The validated data.
   */
  data: T;
}

/**
 * @description
 * The signed-in user. Written by the background whenever Firebase's auth
 * state changes; the popup and every Patreon tab watch it.
 */
export const authUserItem = storage.defineItem<IAuthUser | null>("local:auth-user", { fallback: null });

/**
 * @description
 * A user's watched reactions, as kept in extension storage.
 */
export interface IStoredWatchlist {

  /**
   * @description
   * Whose watchlist it is.
   */
  uid: string;

  /**
   * @description
   * The watched reactions' watchlist keys.
   */
  keys: Array<string>;

  /**
   * @description
   * When each reaction was watched, in epoch milliseconds, by watchlist key.
   * Reactions marked before dates were recorded have none.
   */
  watchedAt?: Record<string, number>;
}

/**
 * @description
 * The reactions the signed-in user marked as watched, as watchlist keys.
 * Written by the background; every Patreon tab watches it.
 */
export const watchlistItem = storage.defineItem<IStoredWatchlist | null>("local:watchlist", { fallback: null });

/**
 * @description
 * The reactions the signed-in user marked as favorites, in the same shape as
 * the watchlist.
 */
export const favoritesItem = storage.defineItem<IStoredWatchlist | null>("local:favorites", { fallback: null });

/**
 * @description
 * Patreon's appearance setting, last seen on a Patreon page, so the popup can
 * match it.
 */
export const patreonColorModeItem = storage.defineItem<TPatreonColorMode | null>("local:patreon-color-mode", { fallback: null });

/**
 * @description
 * Cached tracked posts.
 */
export const postsCacheItem = storage.defineItem<ICached<Array<TPost>> | null>("local:cache-posts", { fallback: null });

/**
 * @description
 * Cached entries.
 */
export const entriesCacheItem = storage.defineItem<ICached<Array<TEntry>> | null>("local:cache-entries", { fallback: null });

/**
 * @description
 * Storage keys used by earlier versions, removed on update.
 */
export const LEGACY_STORAGE_KEYS = ["L8WXOQ56Fw"] as const;
