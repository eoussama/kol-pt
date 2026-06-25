import { z } from "zod";



/**
 * @description
 * Zod schema for environment variable validation.
 */
export const EnvSchema = z.object({
  REACT_APP_FIREBASE_API_KEY: z.string().min(1),
  REACT_APP_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  REACT_APP_FIREBASE_DATABASE_URL: z.string().min(1),
  REACT_APP_FIREBASE_PROJECT_ID: z.string().min(1),
  REACT_APP_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  REACT_APP_FIREBASE_MEASUREMENT_ID: z.string().min(1),
  REACT_APP_FIREBASE_APP_ID: z.string().min(1),
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  REACT_APP_YOUTUBE_DATA_API_KEY: z.string().default(""),
  REACT_APP_CREATOR_NAME: z.string().default("KingOfLightning"),
  REACT_APP_PATREON_URL: z.string().default("https://www.patreon.com"),
  REACT_APP_FIREGUARD_URL: z.string().default("https://ouss.es/fireguard"),
});

export type TEnv = z.infer<typeof EnvSchema>;
