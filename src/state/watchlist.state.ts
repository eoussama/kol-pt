import { create } from "zustand";
import { request } from "../core/messaging/client";
import { toDatabaseKey } from "../core/utils/watchlist";



/**
 * @description
 * The reactions the signed-in user marked as watched, kept per post.
 */
export interface IWatchlistState {

  /**
   * @description
   * Watched reactions, as stored: the watched reaction ids of each post.
   */
  posts: ReadonlyMap<string, ReadonlySet<string>>;

  /**
   * @description
   * When each reaction was watched, in epoch milliseconds, by watchlist key.
   * Reactions marked before dates were recorded have none.
   */
  watchedAt: ReadonlyMap<string, number>;

  /**
   * @description
   * Posts with a change being saved, and the reaction being changed.
   */
  saving: ReadonlyMap<string, string>;

  /**
   * @description
   * Replaces the watched reactions with the stored ones, given as
   * `<postId>/<tagId>` watchlist keys, with when they were watched.
   */
  setKeys: (keys: ReadonlyArray<string>, watchedAt?: Readonly<Record<string, number>>) => void;

  /**
   * @description
   * Marks a reaction as watched or not. The checkbox only changes once the
   * background confirms the save, and nothing else in the post can be
   * changed meanwhile. Resolves to whether it was saved.
   */
  toggle: (postId: string, tagId: string, watched: boolean) => Promise<boolean>;
}

/**
 * @description
 * Groups `<postId>/<tagId>` watchlist keys by post.
 *
 * @param keys - The watchlist keys
 * @returns The watched reaction ids of each post
 */
function groupByPost(keys: ReadonlyArray<string>): Map<string, Set<string>> {
  const posts = new Map<string, Set<string>>();

  for (const key of keys) {
    const [postId = "", tagId = ""] = key.split("/");

    posts.set(postId, (posts.get(postId) ?? new Set()).add(tagId));
  }

  return posts;
}

/**
 * @description
 * State management store for the watchlist. Kept in sync with extension
 * storage by `useWatchlistSync`.
 */
export const useWatchlistStore = create<IWatchlistState>((set, get) => ({
  posts: new Map(),

  watchedAt: new Map(),

  saving: new Map(),

  setKeys(keys, watchedAt = {}) {
    set({ posts: groupByPost(keys), watchedAt: new Map(Object.entries(watchedAt)) });
  },

  async toggle(postId, tagId, watched) {
    const post = toDatabaseKey(postId);

    if (get().saving.has(post)) {
      return false;
    }

    set({ saving: new Map(get().saving).set(post, toDatabaseKey(tagId)) });

    try {
      set({ posts: groupByPost(await request("watchlist.set", { postId, tagId, watched })) });

      return true;
    }
    catch {
      return false;
    }
    finally {
      const saving = new Map(get().saving);

      saving.delete(post);
      set({ saving });
    }
  },
}));

/**
 * @description
 * A post's watchlist, for its reactions' checkboxes.
 *
 * @param postId - The post's ID
 * @returns Whether a reaction is watched, whether a save is in flight for the post, and whether it is for a given reaction
 */
export function usePostWatchlist(postId: string): { isWatched: (tagId: string) => boolean; saving: boolean; isSaving: (tagId: string) => boolean } {
  const post = toDatabaseKey(postId);
  const watched = useWatchlistStore(state => state.posts.get(post));
  const savingTagId = useWatchlistStore(state => state.saving.get(post) ?? null);

  return {
    isWatched: tagId => watched?.has(toDatabaseKey(tagId)) ?? false,
    saving: savingTagId !== null,
    isSaving: tagId => savingTagId === toDatabaseKey(tagId),
  };
}
