import { z } from "zod";



/**
 * @description
 * Zod schema for the post details the Patreon API returns
 * (`data.attributes` of `/api/posts/{id}`), as far as tracking a post needs.
 */
export const PatreonPostSchema = z.object({
  published_at: z.string().nullable().optional(),
  image: z.object({
    large_url: z.string().nullable().optional(),
    url: z.string().nullable().optional(),
  }).nullable().optional(),
});

export type TPatreonPost = z.infer<typeof PatreonPostSchema>;

/**
 * @description
 * What tracking a post takes from Patreon: when it was published, and its
 * video's thumbnail.
 */
export interface IPostDetails {

  /**
   * @description
   * When the post was published, in epoch milliseconds, if known.
   */
  publishedAt: number | null;

  /**
   * @description
   * The post's thumbnail (its video's, for a video post), if any.
   */
  thumbnail: string | null;
}
