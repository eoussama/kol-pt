import { z } from "zod";



/**
 * @description
 * Zod schema for the YouTube Data API video response.
 */
export const YouTubeVideoResponseSchema = z.object({
  snippet: z.object({
    description: z.string(),
    thumbnails: z.object({
      standard: z.object({ url: z.string() }),
    }),
  }),
  statistics: z.object({
    viewCount: z.string(),
  }),
});

export type TYouTubeVideoResponse = z.infer<typeof YouTubeVideoResponseSchema>;
