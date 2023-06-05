import { ICache } from '../../types/cache.type';
import { Nullable } from '../../types/nullable.type';
import { StorageHelper } from '../chrome/storage.helper';



/**
 * @description
 * Helps with managing cached data
 */
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
  static isValid(key: keyof ICache['db']): Promise<boolean> {
    return new Promise(async resolve => {
      try {

        // Getting the cached data
        const cache = await this.load();

        if (cache) {

          // Calculating the expiry time
          const expiryTime = cache.updateTime + CacheHelper.CACHE_LIFE;

          // Checking if the cache has expired
          resolve(expiryTime > Date.now() && cache.db[key].length > 0);
          return true;
        }

        resolve(false);
      } catch (err) {
        resolve(false);
      }
    });
  }

  /**
   * @description
   * Updates a portion of the cached database
   *
   * @param key The key to update
   * @param data The new data to replace the old one with
   */
  static update(key: string, data: any): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {

        // Getting the cached data
        const cache = await this.load();

        if (cache) {

          // Cloning old cache
          const newCache = { ...cache };

          // Assigning values
          newCache.updateTime = Date.now();
          newCache.db = { ...cache.db, [key]: data };

          // Sanitizing the new cache
          const newCacheStr = JSON.stringify(newCache);

          // Saving the new cache
          StorageHelper.set(CacheHelper.CACHE_KEY, newCacheStr);

          resolve();
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * @description
   * Fetches cached data
   *
   * @param key The key to fetch
   */
  static get(key: keyof ICache['db']) {
    return new Promise(async resolve => {
      try {

        // Getting the cached data
        const cache = await this.load();

        // Returning cached data
        resolve(cache?.db[key] ?? []);
      } catch (err) {
        resolve([]);
      }
    })
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
   */
  private static load(): Promise<Nullable<ICache>> {
    return new Promise(async resolve => {
      try {

        // Getting the cached data
        const cache = await StorageHelper.get(CacheHelper.CACHE_KEY);

        // Checking if cached data is valid
        if (!Boolean(cache)) {
          resolve(this.compose());
          return false;
        }
        // Parsing the cached data
        const parsedCache: ICache = JSON.parse(cache) ?? this.compose();

        // Returned the sanitized cached data
        resolve(parsedCache);
      } catch (err) {
        resolve(this.compose());
      }
    });
  }

  /**
   * @description
   * Composes a raw cache object, used to
   * fallback for null cache values.
   */
  private static compose(): ICache {
    return { updateTime: 0, db: { posts: [], entries: [], users: [] } };
  }
}