import { ICache } from "../types/cache.type";
import { Nullable } from "../types/nullable.type";



export class CacheHelper {

  /**
   * @description
   * The cache key in local storage.
   */
  private static readonly CACHE_KEY: string = 'L8WXOQ56Fw';

  /**
   * @description
   * The life span of cached data before
   * expiring and requiring getting updated in milliseconds.
   *
   * @default 1h Hourly refresh
   */
  private static readonly CACHE_LIFE: number = 3600 * 1000;

  /**
   * @description
   * Checks if cached data is valid
   *
   * @param key Specific value key to check
   * if it exists in the cache or not.
   */
  static isValid(key: 'posts' | 'entries'): boolean {
    try {

      // Getting the cached data
      const cache = this.load();

      if (cache) {

        // Calculating the expiry time
        const expiryTime = cache.updateTime + CacheHelper.CACHE_LIFE;

        // Checking if the cache has expired
        return expiryTime > Date.now() && cache.db[key].length > 0;
      }

      return false;
    } catch (err) {
      return false;
    }
  }

  /**
   * @description
   * Updates a portion of the cached database
   *
   * @param key The key to update
   * @param data The new data to replace the old one with
   */
  static update(key: string, data: any) {
    try {

      // Getting the cached data
      const cache = this.load();

      if (cache) {

        // Cloning old cache
        const newCache = { ...cache };

        // Assigning values
        newCache.updateTime = Date.now();
        newCache.db = { ...cache.db, [key]: data };

        // Sanitizing the new cache
        const newCacheStr = JSON.stringify(newCache);

        // Saving the new cache
        localStorage.setItem(CacheHelper.CACHE_KEY, newCacheStr);
      }
    } catch (err) { }
  }

  /**
   * @description
   * Fetches cached data
   *
   * @param key The key to fetch
   */
  static get(key: 'posts' | 'entries') {
    try {

      // Getting the cached data
      const cache = this.load();

      // Returning cached data
      return cache?.db[key] ?? [];
    } catch (err) {
      return [];
    }
  }

  /**
   * @description
   * Fetches the cached data
   */
  private static load(): Nullable<ICache> {
    try {
      // Getting the cached data
      const cache = localStorage.getItem(CacheHelper.CACHE_KEY) as string;

      // Checking if cached data is valid
      if (!Boolean(cache)) {
        return this.compose();
      }
      // Parsing the cached data
      const parsedCache: ICache = JSON.parse(cache) ?? this.compose();

      // Returned the sanitized cached data
      return parsedCache;
    } catch (err) {
      return this.compose();
    }
  }

  /**
   * @description
   * Composes a raw cache object, used to
   * fallback for null cache values.
   */
  private static compose(): ICache {
    return { updateTime: 0, db: { posts: [], entries: [] } };
  }
}