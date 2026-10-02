import { z } from "zod";
import { EEntryType } from "../../enums/entry-type.enum";
import { BaseEntrySchema } from "./base-entry.schema";



/**
 * @description
 * Zod schema for a YouTube channel entry.
 */
export const YouTubeEntrySchema = BaseEntrySchema.extend({
  type: z.literal(EEntryType.YOUTUBE),
  handle: z.string().optional(),
  channelId: z.string().optional(),
});

export type TYouTubeEntry = z.infer<typeof YouTubeEntrySchema>;
