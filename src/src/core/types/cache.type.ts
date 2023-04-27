import { IEntry } from "./entry.type";
import { IPost } from "./post.type";



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
  db: { posts: Array<IPost>, entries: Array<IEntry> };
}