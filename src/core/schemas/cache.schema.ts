import { z } from "zod";

import { SettingsSchema } from "./settings.schema";



/**
 * @description
 * Zod schema for the local cache data.
 */
export const CacheSchema = z.object({
  updateTime: z.number(),
  db: z.object({
    // Raw database values, validated when read by their repositories
    posts: z.unknown(),
    entries: z.unknown(),
    users: z.record(
      z.string(),
      z.object({
        settings: SettingsSchema,
        watchlist: z.array(z.string()),
      }),
    ),
  }),
});

export type TCache = z.infer<typeof CacheSchema>;
