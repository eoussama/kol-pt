import type { IPostsState } from "../core/types/state/posts-state.type";

import { create } from "zustand";
import { hydratePosts } from "../core/domain/hydrate";
import { request } from "../core/messaging/client";



/**
 * @description
 * State management for posts.
 */
export const usePostStore = create<IPostsState>((set, get) => ({

  /**
   * @description
   * Array of posts.
   */
  posts: [],

  /**
   * @description
   * If an error has occured.
   */
  error: false,

  /**
   * @description
   * Flag to indicate if posts are currently being loaded.
   */
  loading: false,

  /**
   * @description
   * Loads posts from cache or from Firebase and sets the posts array.
   *
   * @param cache - If true, tries to load the posts from cache first,
   * then falls back to Firebase if no cache is available. If false, forces a load from Firebase.
   * @returns Promise that resolves when posts are loaded
   */
  loadPosts: async (cache: boolean = true) => {
    try {
      set({ error: false });
      // Reloads keep what is shown until the new posts are in
      set({ loading: get().posts.length === 0 });

      const { posts, entries } = await request("posts.list", { force: !cache });

      set({ posts: hydratePosts(posts, entries) });
    }
    catch {
      set({ error: true });
    }
    finally {
      set({ loading: false });
    }
  },
}));
