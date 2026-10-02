import type { TFirebaseConfig } from "./env.schema";

import { FirebaseConfigSchema } from "./env.schema";



let firebaseConfig: TFirebaseConfig | null = null;

/**
 * @description
 * The Firebase web app configuration, validated on first use.
 *
 * @returns The configuration
 * @throws When a variable is missing from the build environment
 */
export function getFirebaseConfig(): TFirebaseConfig {
  if (firebaseConfig) {
    return firebaseConfig;
  }

  const parsed = FirebaseConfigSchema.safeParse({
    apiKey: import.meta.env.WXT_FIREBASE_API_KEY,
    authDomain: import.meta.env.WXT_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.WXT_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.WXT_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.WXT_FIREBASE_STORAGE_BUCKET,
    measurementId: import.meta.env.WXT_FIREBASE_MEASUREMENT_ID,
    appId: import.meta.env.WXT_FIREBASE_APP_ID,
    messagingSenderId: import.meta.env.WXT_FIREBASE_MESSAGING_SENDER_ID,
  });

  if (!parsed.success) {
    throw new Error(`Invalid Firebase configuration (check the WXT_FIREBASE_* variables):\n${parsed.error.message}`);
  }

  firebaseConfig = parsed.data;

  return firebaseConfig;
}

/**
 * @description
 * The YouTube Data API key, empty if not configured.
 *
 * @returns The API key
 */
export function getYouTubeApiKey(): string {
  return import.meta.env.WXT_YOUTUBE_DATA_API_KEY ?? "";
}
