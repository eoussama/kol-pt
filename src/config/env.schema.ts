import { z } from "zod";



/**
 * @description
 * Zod schema for the Firebase web app configuration.
 */
export const FirebaseConfigSchema = z.object({
  apiKey: z.string().min(1),
  authDomain: z.string().min(1),
  databaseURL: z.string().min(1),
  projectId: z.string().min(1),
  storageBucket: z.string().min(1),
  measurementId: z.string().min(1),
  appId: z.string().min(1),
  messagingSenderId: z.string().min(1),
});

export type TFirebaseConfig = z.infer<typeof FirebaseConfigSchema>;
