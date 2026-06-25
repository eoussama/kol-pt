import { z } from "zod";
import { EEntryType } from "../../enums/entry-type.enum";
import { EntrySchema } from "./entry.schema";



/**
 * @description
 * Zod schema for a YouTube entry.
 */
export const YouTubeEntrySchema = EntrySchema.extend({
  type: z.literal(EEntryType.YOUTUBE),
  handle: z.string(),
  channelId: z.string(),
});

export type TYouTubeEntry = z.infer<typeof YouTubeEntrySchema>;
