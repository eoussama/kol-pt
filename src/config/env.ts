import { EnvSchema } from "./env.schema";



const parsed = EnvSchema.safeParse(import.meta.env);

if (!parsed.success) {
  throw new Error(`Invalid environment configuration:\n${parsed.error.message}`);
}

const env = parsed.data;

/**
 * @description
 * Configuration object containing various environment variables
 * and constants required for the application.
 *
 * @property appId - Firebase app ID.
 * @property apiKey - Firebase API key.
 * @property projectId - Firebase project ID.
 * @property authDomain - Firebase auth domain.
 * @property databaseURL - Firebase database URL.
 * @property measurementId - Firebase measurement ID.
 * @property storageBucket - Firebase storage bucket.
 * @property messagingSenderId - Firebase messaging sender ID.
 * @property patreonUrl - Patreon URL of the creator.
 * @property creatorName - Creator name.
 * @property fireguardUrl - The URL for the Fireguard authentication instance.
 */
export const config = {
  appId: env.REACT_APP_FIREBASE_APP_ID,
  apiKey: env.REACT_APP_FIREBASE_API_KEY,
  projectId: env.REACT_APP_FIREBASE_PROJECT_ID,
  authDomain: env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: env.REACT_APP_FIREBASE_DATABASE_URL,
  measurementId: env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  storageBucket: env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  youtubeApiKey: env.REACT_APP_YOUTUBE_DATA_API_KEY,
  creatorName: env.REACT_APP_CREATOR_NAME,
  patreonUrl: env.REACT_APP_PATREON_URL,
  fireguardUrl: env.REACT_APP_FIREGUARD_URL,
};
