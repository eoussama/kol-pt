import { config } from '../../../config/env';
import { CacheHelper } from './cache.helper';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, GoogleAuthProvider, getAuth } from 'firebase/auth';
import { Database, get, getDatabase, ref, set } from 'firebase/database';



/**
 * @description
 * Helps with all things Firebase
 */
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
   * Firebase realtime authentication instance
   */
  public static auth: Auth;

  /**
   * @description
   * Google auth provider
   */
  public static provider: GoogleAuthProvider;

  /**
   * @description
   * Initializes the firebase app
   */
  static init(): void {
    this.app = initializeApp(config);
    this.db = getDatabase(this.app);
    this.auth = getAuth(this.app);
    this.provider = new GoogleAuthProvider();
  }

  /**
   * @description
   * Retrieves an element from the database
   *
   * @param key The key of the targeted value
   * @param cache Whether to use cache when needed
   */
  static get<T = any>(key: 'posts' | 'entries', cache: boolean = true): Promise<T> {
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
  static set(key: string, value: any): Promise<void> {
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