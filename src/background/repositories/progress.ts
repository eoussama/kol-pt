import type { IProgress } from "../../core/utils/progress";

import { progressItem } from "../../core/storage/items";
import { readProgress } from "../../core/utils/progress";
import { toDatabaseKey } from "../../core/utils/watchlist";
import { readValue, updateValues } from "../database";



let queue: Promise<unknown> = Promise.resolve();

/**
 * @description
 * Runs updates one at a time, so saves from several tabs cannot overwrite
 * each other's copy in extension storage.
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
 * Loads where a user stopped watching each post into extension storage.
 *
 * @param uid - The user's ID
 * @returns Promise that resolves once loaded
 */
export function loadProgress(uid: string): Promise<void> {
  return enqueue(async () => {
    await progressItem.setValue({ uid, posts: readProgress(await readValue(`users/${uid}/progress`)) });
  });
}

/**
 * @description
 * Forgets the saved positions, e.g. after signing out.
 *
 * @returns Promise that resolves once cleared
 */
export function clearProgress(): Promise<void> {
  return enqueue(() => progressItem.setValue(null));
}

/**
 * @description
 * Saves where a user stopped watching a post, or forgets it, in the database
 * and extension storage. Only that post's position is written.
 *
 * @param uid - The user's ID
 * @param postId - The post's ID
 * @param time - The position in seconds, null to forget it
 * @param now - The current time, in epoch milliseconds
 * @returns Promise that resolves once saved
 */
export function setProgress(uid: string, postId: string, time: number | null, now: () => number = Date.now): Promise<void> {
  return enqueue(async () => {
    const key = toDatabaseKey(postId);
    const progress: IProgress | null = time === null ? null : { time, updatedAt: now() };

    await updateValues(`users/${uid}/progress`, { [key]: progress });

    const current = await progressItem.getValue();
    const posts = current?.uid === uid ? { ...current.posts } : readProgress(await readValue(`users/${uid}/progress`));

    if (progress) {
      posts[key] = progress;
    }
    else {
      delete posts[key];
    }

    await progressItem.setValue({ uid, posts });
  });
}
