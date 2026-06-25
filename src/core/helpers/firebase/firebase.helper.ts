import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Database } from "firebase/database";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { config } from "../../../config/env";



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
   *
   * @returns The initialized Firebase app instance
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
   *
   * @returns The Firebase Realtime Database instance
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
   *
   * @returns The Firebase Auth instance
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
   *
   * @returns The Google auth provider instance
   */
  public static get provider(): GoogleAuthProvider {
    if (!this._provider) {
      this._provider = new GoogleAuthProvider();
    }

    return this._provider;
  }
}
