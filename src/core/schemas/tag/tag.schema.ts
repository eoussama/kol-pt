import { z } from "zod";
import { IdSchema, NumberLikeSchema, TextSchema } from "../primitives.schema";



/**
 * @description
 * Zod schema for a tag: one reaction inside a post, in seconds.
 */
export const TagSchema = z.looseObject({
  id: IdSchema,
  entryId: IdSchema,
  label: TextSchema,
  description: z.string().optional().default(""),
  startTime: NumberLikeSchema,
  endTime: NumberLikeSchema,
  context: z.record(z.string(), z.unknown()).optional().default({}),
});

export type TTag = z.infer<typeof TagSchema>;

/**
 * @description
 * Zod schema for the extra context of a tag about a YouTube channel.
 */
export const YouTubeContextSchema = z.looseObject({
  title: z.string().optional(),
  videoId: z.string().optional(),
  altTitles: z.array(z.string()).optional(),
});

export type TYouTubeContext = z.infer<typeof YouTubeContextSchema>;
