import { z } from "zod";



/**
 * @description
 * Zod schema for the Jikan API response for a target anime.
 */
export const JikanResponseSchema = z.object({
  synopsis: z.string(),
  images: z.object({
    webp: z.object({
      large_image_url: z.string(),
    }),
  }),
  genres: z.array(z.object({ name: z.string() })),
  title: z.string(),
  title_english: z.string().nullable(),
  title_japanese: z.string().nullable(),
});

export type TJikanResponse = z.infer<typeof JikanResponseSchema>;
