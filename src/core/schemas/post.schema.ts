import { z } from "zod";
import { IdSchema, listOf, TimestampSchema } from "./primitives.schema";
import { TagSchema } from "./tag/tag.schema";



/**
 * @description
 * Zod schema for a post. Malformed tags are dropped individually.
 */
export const PostSchema = z.looseObject({
  id: IdSchema,
  title: z.string(),
  description: z.string().optional().default(""),
  creationDate: TimestampSchema,
  thumbnail: z.string().optional().default(""),
  tags: listOf(TagSchema),
});

export type TPost = z.infer<typeof PostSchema>;

/**
 * @description
 * Zod schema for the posts list. Malformed posts are dropped individually.
 */
export const PostListSchema = listOf(PostSchema);
