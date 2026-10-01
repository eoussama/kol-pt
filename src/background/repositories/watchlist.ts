import type { IStoredWatchlist } from "../../core/storage/items";
import type { IWatchlistEntry } from "../../core/utils/watchlist";
import { watchlistItem } from "../../core/storage/items";

import { readWatchlistEntries, watchlistKey } from "../../core/utils/watchlist";
import { readValue, updateValues } from "../database";



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
 * @returns Promise resolving to the watched reactions' keys
 */
export function loadWatchlist(uid: string): Promise<Array<string>> {
  return enqueue(async () => {
    const stored = toStored(uid, readWatchlistEntries(await readValue(`users/${uid}/watchlist`)));

    await watchlistItem.setValue(stored);

    return stored.keys;
  });
}

/**
 * @description
 * Forgets the watchlist, e.g. after signing out.
 *
 * @returns Promise that resolves once cleared
 */
export function clearWatchlist(): Promise<void> {
  return enqueue(() => watchlistItem.setValue(null));
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
 * @returns Promise resolving to the watched reactions' keys
 */
export function setWatched(uid: string, postId: string, tagId: string, watched: boolean, now: () => number = Date.now): Promise<Array<string>> {
  return enqueue(async () => {
    const key = watchlistKey(postId, tagId);
    const watchedAt = now();

    await updateValues(`users/${uid}/watchlist`, { [key]: watched ? watchedAt : null });

    const current = await watchlistItem.getValue();
    const entries = (current?.uid === uid ? fromStored(current) : readWatchlistEntries(await readValue(`users/${uid}/watchlist`)))
      .filter(entry => entry.key !== key);

    if (watched) {
      entries.push({ key, watchedAt });
    }

    const stored = toStored(uid, entries);

    await watchlistItem.setValue(stored);

    return stored.keys;
  });
}
