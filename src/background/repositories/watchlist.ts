import type { WxtStorageItem } from "wxt/utils/storage";
import type { IStoredWatchlist } from "../../core/storage/items";
import type { IWatchlistEntry } from "../../core/utils/watchlist";

import { favoritesItem, watchlistItem } from "../../core/storage/items";
import { readWatchlistEntries, watchlistKey } from "../../core/utils/watchlist";
import { readValue, updateValues } from "../database";



/**
 * @description
 * A list of marked reactions: where it lives in the database and in
 * extension storage.
 */
export interface IMarkList {

  /**
   * @description
   * The name under `users/{uid}/` in the database.
   */
  path: string;

  /**
   * @description
   * The extension storage copy.
   */
  item: WxtStorageItem<IStoredWatchlist | null, Record<string, unknown>>;
}

/**
 * @description
 * The reactions the user watched.
 */
export const watchlist: IMarkList = { path: "watchlist", item: watchlistItem };

/**
 * @description
 * The reactions the user favorited.
 */
export const favorites: IMarkList = { path: "favorites", item: favoritesItem };

let queue: Promise<unknown> = Promise.resolve();

/**
 * @description
 * Builds the stored watchlist from its entries.
 *
 * @param uid - The user's ID
 * @param entries - The watched reactions
 * @returns The watchlist to store
 */
function toStored(uid: string, entries: ReadonlyArray<IWatchlistEntry>): IStoredWatchlist {
  const watchedAt: Record<string, number> = {};

  for (const entry of entries) {
    if (entry.watchedAt !== null) {
      watchedAt[entry.key] = entry.watchedAt;
    }
  }

  return { uid, keys: entries.map(entry => entry.key), watchedAt };
}

/**
 * @description
 * Lists the entries of a stored watchlist.
 *
 * @param stored - The stored watchlist
 * @returns The watched reactions
 */
function fromStored(stored: IStoredWatchlist): Array<IWatchlistEntry> {
  return stored.keys.map(key => ({ key, watchedAt: stored.watchedAt?.[key] ?? null }));
}

/**
 * @description
 * Runs watchlist updates one at a time, so concurrent toggles from several
 * tabs cannot overwrite each other's copy in extension storage.
 *
 * @param task - The update
 * @returns Promise resolving to the update's result
 */
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = queue.then(task);

  queue = result.catch(() => undefined);

  return result;
}

/**
 * @description
 * Loads a user's watchlist from the database into extension storage.
 *
 * @param uid - The user's ID
 * @param list - The list to load, the watchlist unless given
 * @returns Promise resolving to the watched reactions' keys
 */
export function loadWatchlist(uid: string, list: IMarkList = watchlist): Promise<Array<string>> {
  return enqueue(async () => {
    const stored = toStored(uid, readWatchlistEntries(await readValue(`users/${uid}/${list.path}`)));

    await list.item.setValue(stored);

    return stored.keys;
  });
}

/**
 * @description
 * Forgets the watchlist, e.g. after signing out.
 *
 * @param list - The list to clear, the watchlist unless given
 * @returns Promise that resolves once cleared
 */
export function clearWatchlist(list: IMarkList = watchlist): Promise<void> {
  return enqueue(() => list.item.setValue(null));
}

/**
 * @description
 * Marks a reaction as watched or not, in the database and extension storage.
 * Only that reaction's key is written: the time it was watched, or nothing.
 *
 * @param uid - The user's ID
 * @param postId - The post's ID
 * @param tagId - The reaction's (tag's) ID
 * @param watched - Whether the reaction is watched
 * @param now - The current time, in epoch milliseconds
 * @param list - The list to change, the watchlist unless given
 * @returns Promise resolving to the watched reactions' keys
 */
export function setWatched(uid: string, postId: string, tagId: string, watched: boolean, now: () => number = Date.now, list: IMarkList = watchlist): Promise<Array<string>> {
  return enqueue(async () => {
    const key = watchlistKey(postId, tagId);
    const watchedAt = now();

    await updateValues(`users/${uid}/${list.path}`, { [key]: watched ? watchedAt : null });

    const current = await list.item.getValue();
    const entries = (current?.uid === uid ? fromStored(current) : readWatchlistEntries(await readValue(`users/${uid}/${list.path}`)))
      .filter(entry => entry.key !== key);

    if (watched) {
      entries.push({ key, watchedAt });
    }

    const stored = toStored(uid, entries);

    await list.item.setValue(stored);

    return stored.keys;
  });
}
