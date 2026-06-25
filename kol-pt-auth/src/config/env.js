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
 * @property authUrl - The URL for KOL PT Authenticator.
 */
export const config = {
  appId: import.meta.env.REACT_APP_FIREBASE_APP_ID,
  apiKey: import.meta.env.REACT_APP_FIREBASE_API_KEY,
  projectId: import.meta.env.REACT_APP_FIREBASE_PROJECT_ID,
  authDomain: import.meta.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.REACT_APP_FIREBASE_DATABASE_URL,
  measurementId: import.meta.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  storageBucket: import.meta.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  youtubeApiKey: import.meta.env.REACT_APP_YOUTUBE_DATA_API_KEY ?? '',
  creatorName: import.meta.env.REACT_APP_CREATOR_NAME ?? '',
  patreonUrl: import.meta.env.REACT_APP_PATREON_URL ?? '',
  authUrl: import.meta.env.REACT_APP_AUTH_URL ?? ''
};
