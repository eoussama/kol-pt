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
  private static _app: FirebaseApp;

  /**
   * @description
   * Firebase realtime database instance
   */
  private static _db: Database;

  /**
   * @description
   * Firebase realtime authentication instance
   */
  private static _auth: Auth;

  /**
   * @description
   * Google auth provider
   */
  private static _provider: GoogleAuthProvider;

  /**
   * @description
   * Firebase realtime app instance
   */
  public static get app(): FirebaseApp {
    if (!this._app) {
      this._app = initializeApp(config);
    }

    return this._app;
  }

  /**
   * @description
   * Firebase realtime database instance
   */
  public static get db(): Database {
    if (!this._db) {
      this._db = getDatabase(this.app);
    }

    return this._db;
  }

  /**
   * @description
   * Firebase realtime authentication instance
   */
  public static get auth(): Auth {
    if (!this._auth) {
      this._auth = getAuth(this.app);
    }

    return this._auth;
  }

  /**
   * @description
   * Google auth provider
   */
  public static get provider(): GoogleAuthProvider {
    if (!this._provider) {
      this._provider = new GoogleAuthProvider();
    }

    return this._provider;
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