import type { StoreApi, UseBoundStore } from "zustand";

import { create } from "zustand";
import { toDatabaseKey } from "../core/utils/watchlist";



/**
 * @description
 * The reactions the signed-in user marked (as watched, or as favorites),
 * kept per post.
 */
export interface IMarkState {

  /**
   * @description
   * Marked reactions, as stored: the marked reaction ids of each post.
   */
  posts: ReadonlyMap<string, ReadonlySet<string>>;

  /**
   * @description
   * When each reaction was marked, in epoch milliseconds, by watchlist key.
   * Reactions marked before dates were recorded have none.
   */
  markedAt: ReadonlyMap<string, number>;

  /**
   * @description
   * Posts with a change being saved, and the reaction being changed.
   */
  saving: ReadonlyMap<string, string>;

  /**
   * @description
   * Replaces the marked reactions with the stored ones, given as
   * `<postId>/<tagId>` watchlist keys, with when they were marked.
   */
  setKeys: (keys: ReadonlyArray<string>, markedAt?: Readonly<Record<string, number>>) => void;

  /**
   * @description
   * Marks a reaction or unmarks it. The control only changes once the
   * background confirms the save, and nothing else in the post can be
   * changed meanwhile. Resolves to whether it was saved.
   */
  toggle: (postId: string, tagId: string, marked: boolean) => Promise<boolean>;
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
 * Sends a change to the background.
 *
 * @param postId - The post's ID
 * @param tagId - The reaction's (tag's) ID
 * @param marked - Whether the reaction is marked
 * @returns Promise resolving to every marked reaction's key
 */
export type TMarkSender = (postId: string, tagId: string, marked: boolean) => Promise<Array<string>>;

/**
 * @description
 * Creates a store of marked reactions, per post. A change is saved before it
 * shows, and locks the post's controls until it is. Kept in sync with
 * extension storage by a sync hook.
 *
 * @param send - Saves a change in the background
 * @returns The store
 */
export function createMarkStore(send: TMarkSender): UseBoundStore<StoreApi<IMarkState>> {
  return create<IMarkState>((set, get) => ({
    posts: new Map(),

    markedAt: new Map(),

    saving: new Map(),

    setKeys(keys, markedAt = {}) {
      set({ posts: groupByPost(keys), markedAt: new Map(Object.entries(markedAt)) });
    },

    async toggle(postId, tagId, marked) {
      const post = toDatabaseKey(postId);

      if (get().saving.has(post)) {
        return false;
      }

      set({ saving: new Map(get().saving).set(post, toDatabaseKey(tagId)) });

      try {
        set({ posts: groupByPost(await send(postId, tagId, marked)) });

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
}

/**
 * @description
 * A post's marked reactions, for its reactions' controls.
 *
 * @param store - The store of marked reactions
 * @param postId - The post's ID
 * @returns Whether a reaction is marked, whether a save is in flight for the post, and whether it is for a given reaction
 */
export function usePostMarks(store: UseBoundStore<StoreApi<IMarkState>>, postId: string): { isMarked: (tagId: string) => boolean; saving: boolean; isSaving: (tagId: string) => boolean } {
  const post = toDatabaseKey(postId);
  const marked = store(state => state.posts.get(post));
  const savingTagId = store(state => state.saving.get(post) ?? null);

  return {
    isMarked: tagId => marked?.has(toDatabaseKey(tagId)) ?? false,
    saving: savingTagId !== null,
    isSaving: tagId => savingTagId === toDatabaseKey(tagId),
  };
}
