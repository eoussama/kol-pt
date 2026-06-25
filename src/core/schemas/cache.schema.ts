import { z } from "zod";
import { EntrySchema } from "./entry/entry.schema";
import { PostSchema } from "./post.schema";
import { SettingsSchema } from "./settings.schema";



/**
 * @description
 * Zod schema for the local cache data.
 */
export const CacheSchema = z.object({
  updateTime: z.number(),
  db: z.object({
    posts: z.array(PostSchema),
    entries: z.array(EntrySchema),
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
