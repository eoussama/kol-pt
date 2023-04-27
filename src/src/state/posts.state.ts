import { create } from "zustand";
import { IPostsState } from "../core/types/state/posts-state.type";
import { PostsHelper } from "../core/helpers/firebase/posts.helper";
import { CacheHelper } from "../core/helpers/firebase/cache.helper";



export const usePostStore = create<IPostsState>(set => ({
  posts: [],
  loading: false,
  loadPosts: async (cache: boolean = true) => {
    set({ loading: true });

    const data = await PostsHelper.load(cache);

    set({ loading: false });
    set(() => ({ posts: data }));
  },
  clearCache: () => { CacheHelper.clear() }
}));