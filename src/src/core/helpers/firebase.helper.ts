import { FirebaseApp, initializeApp } from "firebase/app";
import { Database, getDatabase } from "firebase/database";
import { config } from "../../config/env";



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
   * Returns the realtime database instance
   */
  static getDb(): Database {
    return this.db;
  }
}