import { z } from "zod";



/**
 * @description
 * Zod schema for the YouTube info object returned by the YouTube helper.
 */
export const YouTubeInfoSchema = z.object({
  description: z.string(),
  thumbnail: z.string(),
  totalViews: z.number().optional(),
  subscribers: z.number().optional(),
});

export type TYouTubeInfo = z.infer<typeof YouTubeInfoSchema>;
