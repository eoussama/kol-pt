import { EnvSchema } from "./env.schema";



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
 * @property youtubeApiKey - YouTube Data API key.
 * @property patreonUrl - Patreon URL of the creator.
 * @property creatorName - Creator name.
 * @property fireguardUrl - The URL for the Fireguard authentication instance.
 */
export interface IConfig {
  appId: string;
  apiKey: string;
  projectId: string;
  authDomain: string;
  databaseURL: string;
  measurementId: string;
  storageBucket: string;
  messagingSenderId: string;
  youtubeApiKey: string;
  creatorName: string;
  patreonUrl: string;
  fireguardUrl: string;
}

let cached: IConfig | null = null;

/**
 * @description
 * Validates the build-time environment on first use and returns the
 * application configuration. Validation is deferred so that modules which
 * never touch the configuration (tests, the content script) can be imported
 * without a complete environment.
 *
 * @returns The validated configuration
 */
export function getConfig(): IConfig {
  if (cached) {
    return cached;
  }

  const parsed = EnvSchema.safeParse(import.meta.env);

  if (!parsed.success) {
    throw new Error(`Invalid environment configuration:\n${parsed.error.message}`);
  }

  const env = parsed.data;

  cached = {
    appId: env.WXT_FIREBASE_APP_ID,
    apiKey: env.WXT_FIREBASE_API_KEY,
    projectId: env.WXT_FIREBASE_PROJECT_ID,
    authDomain: env.WXT_FIREBASE_AUTH_DOMAIN,
    databaseURL: env.WXT_FIREBASE_DATABASE_URL,
    measurementId: env.WXT_FIREBASE_MEASUREMENT_ID,
    storageBucket: env.WXT_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.WXT_FIREBASE_MESSAGING_SENDER_ID,
    youtubeApiKey: env.WXT_YOUTUBE_DATA_API_KEY,
    creatorName: env.WXT_CREATOR_NAME,
    patreonUrl: env.WXT_PATREON_URL,
    fireguardUrl: env.WXT_FIREGUARD_URL,
  };

  return cached;
}
