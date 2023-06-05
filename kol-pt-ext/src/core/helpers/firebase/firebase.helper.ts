import { config } from '../../../config/env';
import { Database, getDatabase } from 'firebase/database';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, GoogleAuthProvider, getAuth } from 'firebase/auth';



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
}