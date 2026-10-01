import type { TEntry } from "../schemas/entry/entry.schema";
import type { TPost } from "../schemas/post.schema";
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
 * The reactions the signed-in user marked as watched, as watchlist keys.
 * Written by the background; every Patreon tab watches it.
 */
export const watchlistItem = storage.defineItem<{ uid: string; keys: Array<string> } | null>("local:watchlist", { fallback: null });

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
