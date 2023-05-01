import { Post } from "../../models/post.model";



/**
 * @description
 * Interface representing the shape of the state object for posts.
 */
export interface IPostsState {

  /**
   * @description
   * Flag indicating if posts are currently being loaded.
   */
  loading: boolean;

  /**
   * @description
   * Array of Post objects representing the posts that have been loaded.
   */
  posts: Array<Post>;

  /**
   * @description
   * Function to clear the cache of loaded posts.
   */
  clearCache: () => void;

  /**
   * @description
   * Function to load posts. If `cache` is true, attempts to load posts from cache.
   * Otherwise, loads posts from API.
   * 
   * @param cache - Optional flag indicating whether to load posts from cache or API.
   * Default is false.
   */
  loadPosts: (cache?: boolean) => void;
}