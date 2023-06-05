import { CacheHelper } from '../cache.helper';
import { get, ref, set } from 'firebase/database';
import { ICache } from '../../../types/cache.type';
import { FirebaseHelper } from '../firebase.helper';



/**
 * @description
 * Helps with generic firebase realtime database data read and write
 */
export class RepositoryHelper {

  /**
   * @description
   * Retrieves an element from the database
   *
   * @param key The key of the targeted value
   * @param cache Whether to use cache when needed
   */
  static get<T = any>(key: keyof ICache['db'], cache: boolean = true): Promise<T> {
    return new Promise(async resolve => {
      if (cache && await CacheHelper.isValid(key)) {

        // Fetching data from cache
        const data = CacheHelper.get(key);

        // Returning fetched data
        return resolve(data as T);
      }

      // Retrieving data from firebase
      const snapRef = ref(FirebaseHelper.db, key);
      const snapshot = await get(snapRef);
      const data = snapshot.val() as T;

      // Updating the cache
      CacheHelper.update(key, data);

      // Returning fetched data
      resolve(data);
    });
  }

  /**
   * @description
   * Updates an element in the database
   *
   * @param key The key of the targeted value
   * @param value The value to update
   */
  static set(key: keyof ICache['db'], value: any): Promise<void> {
    return new Promise(async resolve => {

      // Preparing the target reference
      const snapRef = ref(FirebaseHelper.db, key);

      // Updating the valie
      await set(snapRef, value);

      // Reporting back
      resolve();
    });
  }
}
