import { config } from "../../config/env";
import { CacheHelper } from "./cache.helper";
import { FirebaseApp, initializeApp } from "firebase/app";
import { Database, get, getDatabase, ref } from "firebase/database";



export class FirebaseHelper {

  /**
   * @description
   * Firebase realtime app instance
   */
  private static app: FirebaseApp;

  /**
   * @description
   * Firebase realtime database instance
   */
  private static db: Database;

  /**
   * @description
   * Initializes the firebase app
   */
  static init(): void {
    this.app = initializeApp(config);
    this.db = getDatabase(this.app);
  }

  /**
   * @description
   * Retrieves an element from the database
   *
   * @param key The key of the targeted value
   */
  static get<T = any>(key: 'posts' | 'entries'): Promise<T> {
    return new Promise(async resolve => {
      if (CacheHelper.isValid(key)) {

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
}