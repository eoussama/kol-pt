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
*/
export const config = {
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  youtubeApiKey: process.env.REACT_APP_YOUTUBE_DATA_API_KEY ?? '',
  creatorName: process.env.REACT_APP_CREATOR_NAME ?? '',
  patreonUrl: process.env.REACT_APP_PATREON_URL ?? ''
};