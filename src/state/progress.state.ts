import type { IProgress } from "../core/utils/progress";

import { create } from "zustand";
import { toDatabaseKey } from "../core/utils/watchlist";



/**
 * @description
 * Where the signed-in user stopped watching each post.
 */
export interface IProgressState {

  /**
   * @description
   * The saved positions, by post (database key).
   */
  posts: ReadonlyMap<string, IProgress>;

  /**
   * @description
   * Replaces the saved positions with the stored ones.
   */
  setPosts: (posts: Readonly<Record<string, IProgress>> | null | undefined) => void;
}

/**
 * @description
 * State management store for the saved positions. Kept in sync with
 * extension storage by `useProgressSync`.
 */
export const useProgressStore = create<IProgressState>(set => ({
  posts: new Map(),
  setPosts: posts => set({ posts: new Map(Object.entries(posts ?? {})) }),
}));

/**
 * @description
 * Where the user stopped watching a post.
 *
 * @param postId - The post's ID
 * @returns The saved position, if any
 */
export function usePostProgress(postId: string): IProgress | undefined {
  return useProgressStore(e => e.posts.get(toDatabaseKey(postId)));
}
