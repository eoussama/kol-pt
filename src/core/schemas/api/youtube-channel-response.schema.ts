import { z } from "zod";



/**
 * @description
 * Zod schema for the YouTube Data API channel response.
 */
export const YouTubeChannelResponseSchema = z.object({
  snippet: z.object({
    description: z.string(),
    thumbnails: z.object({
      medium: z.object({ url: z.string() }),
    }),
  }),
  statistics: z.object({
    subscriberCount: z.string(),
  }),
});

export type TYouTubeChannelResponse = z.infer<typeof YouTubeChannelResponseSchema>;
