import { z } from "zod";
import { TagSchema } from "./tag/tag.schema";



/**
 * @description
 * Zod schema for a post.
 */
export const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional().default(""),
  creationDate: z.number(),
  thumbnail: z.string().optional().default(""),
  tags: z.array(TagSchema).optional().default([]),
}).passthrough();

export type TPost = z.infer<typeof PostSchema>;
