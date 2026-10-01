import { create } from "zustand";
import { request } from "../core/messaging/client";
import { watchlistKey } from "../core/utils/watchlist";



/**
 * @description
 * The reactions the signed-in user marked as watched.
 */
export interface IWatchlistState {

  /**
   * @description
   * Watched reactions, as stored, by watchlist key.
   */
  keys: ReadonlySet<string>;

  /**
   * @description
   * Changes sent to the background but not confirmed yet, by watchlist key.
   */
  pending: ReadonlyMap<string, boolean>;

  /**
   * @description
   * Replaces the watched reactions with the stored ones.
   */
  setKeys: (keys: ReadonlyArray<string>) => void;

  /**
   * @description
   * Marks a reaction as watched or not. The change shows immediately and is
   * rolled back if saving fails.
   */
  toggle: (postId: string, tagId: string, watched: boolean) => Promise<void>;
}

/**
 * @description
 * State management store for the watchlist. Kept in sync with extension
 * storage by `useWatchlistSync`.
 */
export const useWatchlistStore = create<IWatchlistState>((set, get) => ({
  keys: new Set(),

  pending: new Map(),

  setKeys(keys) {
    set({ keys: new Set(keys) });
  },

  async toggle(postId, tagId, watched) {
    const key = watchlistKey(postId, tagId);

    // A later toggle of the same reaction owns the pending state from then on
    const settle = () => {
      if (get().pending.get(key) !== watched) {
        return;
      }

      const pending = new Map(get().pending);

      pending.delete(key);
      set({ pending });
    };

    set({ pending: new Map(get().pending).set(key, watched) });

    try {
      set({ keys: new Set(await request("watchlist.set", { postId, tagId, watched })) });
    }
    catch {
      // Dropping the pending change shows the stored state again
    }
    finally {
      settle();
    }
  },
}));

/**
 * @description
 * Whether a reaction is watched, including changes not confirmed yet.
 *
 * @param postId - The post's ID
 * @param tagId - The reaction's (tag's) ID
 * @returns True if watched
 */
export function useIsWatched(postId: string, tagId: string): boolean {
  const key = watchlistKey(postId, tagId);

  return useWatchlistStore(state => state.pending.get(key) ?? state.keys.has(key));
}
