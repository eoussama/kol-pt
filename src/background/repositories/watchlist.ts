import { watchlistItem } from "../../core/storage/items";
import { readWatchlist, watchlistKey } from "../../core/utils/watchlist";
import { readValue, updateValues } from "../database";



let queue: Promise<unknown> = Promise.resolve();

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
    const keys = readWatchlist(await readValue(`users/${uid}/watchlist`));

    await watchlistItem.setValue({ uid, keys });

    return keys;
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
 * Only that reaction's key is written.
 *
 * @param uid - The user's ID
 * @param postId - The post's ID
 * @param tagId - The reaction's (tag's) ID
 * @param watched - Whether the reaction is watched
 * @returns Promise resolving to the watched reactions' keys
 */
export function setWatched(uid: string, postId: string, tagId: string, watched: boolean): Promise<Array<string>> {
  return enqueue(async () => {
    const key = watchlistKey(postId, tagId);

    await updateValues(`users/${uid}/watchlist`, { [key]: watched ? true : null });

    const current = await watchlistItem.getValue();
    const keys = new Set(current?.uid === uid ? current.keys : []);

    if (watched) {
      keys.add(key);
    }
    else {
      keys.delete(key);
    }

    await watchlistItem.setValue({ uid, keys: [...keys] });

    return [...keys];
  });
}
