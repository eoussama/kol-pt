import type { TUnsafe } from "@eoussama/core";
import type { ICache } from "../../types/cache.type";
import { CacheSchema } from "../../schemas/cache.schema";
import { StorageHelper } from "../chrome/storage.helper";



/**
 * @description
 * Helps with managing cached data
 */
export class CacheHelper {
  /**
   * @description
   * The cache key in local storage.
   */
  private static readonly CACHE_KEY: string = "L8WXOQ56Fw";

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
   * @param key - Specific value key to check if it exists in the cache or not
   * @returns Promise resolving to true if the cache is valid
   */
  static async isValid(key: keyof ICache["db"]): Promise<boolean> {
    try {
      const cache = await this.load();

      if (cache) {
        const expiryTime = cache.updateTime + CacheHelper.CACHE_LIFE;
        const value = cache.db[key];

        return expiryTime > Date.now() && (
          Array.isArray(value)
            ? (value as Array<unknown>).length > 0
            : Object.keys(value).length > 0
        );
      }

      return false;
    }
    catch {
      return false;
    }
  }

  /**
   * @description
   * Updates a portion of the cached database
   *
   * @param key - The key to update
   * @param data - The new data to replace the old one with
   * @returns Promise that resolves when the cache is updated
   */
  static async update(key: string, data: ICache["db"][keyof ICache["db"]]): Promise<void> {
    const cache = await this.load();

    if (cache) {
      const newCache = { ...cache };

      newCache.updateTime = Date.now();
      newCache.db = { ...cache.db, [key]: data };

      const newCacheStr = JSON.stringify(newCache);

      StorageHelper.set(CacheHelper.CACHE_KEY, newCacheStr);
    }
  }

  /**
   * @description
   * Fetches cached data
   *
   * @param key - The key to fetch
   * @returns Promise resolving to the cached value or an empty array
   */
  static async get(key: keyof ICache["db"]): Promise<ICache["db"][keyof ICache["db"]] | Array<never>> {
    try {
      const cache = await this.load();

      return cache?.db[key] ?? [];
    }
    catch {
      return [];
    }
  }

  /**
   * @description
   * Clears the local cache
   */
  static clear(): void {
    StorageHelper.clear(CacheHelper.CACHE_KEY);
  }

  /**
   * @description
   * Fetches the cached data
   *
   * @returns Promise resolving to the cache object or null
   */
  private static async load(): Promise<TUnsafe<ICache>> {
    try {
      const raw = await StorageHelper.get(CacheHelper.CACHE_KEY);

      if (!raw) {
        return this.compose();
      }

      const parsed = CacheSchema.safeParse(JSON.parse(raw));

      if (!parsed.success) {
        return this.compose();
      }

      return parsed.data as ICache;
    }
    catch {
      return this.compose();
    }
  }

  /**
   * @description
   * Composes a raw cache object, used to
   * fallback for null cache values.
   *
   * @returns A fresh empty cache object
   */
  private static compose(): ICache {
    return { updateTime: 0, db: { posts: [], entries: [], users: {} } };
  }
}
