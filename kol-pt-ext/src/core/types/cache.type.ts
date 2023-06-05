import { IPost } from "./post.type";
import { IEntry } from "./entry/entry.type";
import { ISettings } from "./settings.type";



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

    /**
     * Object of cached users.
     */
    users: {

      /**
       * @description
       * The user's ID
       */
      [key: string]: {

        /**
         * @description
         * User's settings
         */
        settings: ISettings;

        /**
         * @description
         * User's watched reactions (IDs)
         */
        watchlist: Array<string>;
      }
    };
  };
}