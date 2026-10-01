import { z } from "zod";



/**
 * @description
 * Zod schema for environment variable validation.
 */
export const EnvSchema = z.object({
  WXT_FIREBASE_API_KEY: z.string().min(1),
  WXT_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  WXT_FIREBASE_DATABASE_URL: z.string().min(1),
  WXT_FIREBASE_PROJECT_ID: z.string().min(1),
  WXT_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  WXT_FIREBASE_MEASUREMENT_ID: z.string().min(1),
  WXT_FIREBASE_APP_ID: z.string().min(1),
  WXT_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  WXT_YOUTUBE_DATA_API_KEY: z.string().default(""),
  WXT_CREATOR_NAME: z.string().default("KingOfLightning"),
  WXT_PATREON_URL: z.string().default("https://www.patreon.com"),
  WXT_FIREGUARD_URL: z.string().default("https://ouss.es/fireguard"),
});

export type TEnv = z.infer<typeof EnvSchema>;
