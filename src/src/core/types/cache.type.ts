import { IPost } from "./post.type";
import { IEntry } from "./entry.type";



/**
 * @description
 * Local cache data definition
 */
export interface ICache {

  /**
   * @description
   * The timestamp when the cache was last updated.
   */
  updateTime: number;

  /**
   * @description
   * Cached database model
   */
  db: {

    /**
     * Array of cached posts.
     */
    posts: Array<IPost>;

    /**
     * Array of cached entries.
     */
    entries: Array<IEntry>;
  };
}