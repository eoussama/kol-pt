import type { ICache } from "../../../types/cache.type";
import { get, ref, set } from "firebase/database";
import { CacheHelper } from "../cache.helper";
import { FirebaseHelper } from "../firebase.helper";



/**
 * @description
 * Helps with generic firebase realtime database data read and write
 */
export class RepositoryHelper {
  /**
   * @description
   * Retrieves an element from the database
   *
   * @param key - The key of the targeted value
   * @param cache - Whether to use cache when needed
   * @returns Promise resolving to the fetched data
   */
  static async get<T = unknown>(key: string, cache: boolean = true): Promise<T> {
    const cacheKey = key as keyof ICache["db"];

    if (cache && await CacheHelper.isValid(cacheKey)) {
      const data = await CacheHelper.get(cacheKey);

      return data as T;
    }

    const snapRef = ref(FirebaseHelper.db, key);
    const snapshot = await get(snapRef);
    const data = snapshot.val() as T;

    if (cache) {
      CacheHelper.update(key, data as ICache["db"][keyof ICache["db"]]);
    }

    return data;
  }

  /**
   * @description
   * Updates an element in the database
   *
   * @param key - The key of the targeted value
   * @param value - The value to update
   * @returns Promise that resolves when the update is complete
   */
  static async set(key: string, value: unknown): Promise<void> {
    const snapRef = ref(FirebaseHelper.db, key);

    await set(snapRef, value);
  }
}
