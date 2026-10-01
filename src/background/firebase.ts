import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth/web-extension";
import type { Database } from "firebase/database";

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth/web-extension";
import { getDatabase } from "firebase/database";
import { getFirebaseConfig } from "../config/env";



let app: FirebaseApp | null = null;

/**
 * @description
 * The Firebase app, created on first use. Only the background talks to
 * Firebase.
 *
 * @returns The Firebase app
 */
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = initializeApp(getFirebaseConfig());
  }

  return app;
}

/**
 * @description
 * Firebase Auth, using the web extension build: no popup or redirect code,
 * and the session persisted in IndexedDB, which survives the background
 * being suspended.
 *
 * @returns The Auth instance
 */
export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

/**
 * @description
 * The Realtime Database.
 *
 * @returns The Database instance
 */
export function getFirebaseDatabase(): Database {
  return getDatabase(getFirebaseApp());
}
