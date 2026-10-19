import { z } from "zod";



/**
 * @description
 * Zod schema for an anime's details, from AniList or Jikan.
 */
export const AnimeInfoSchema = z.object({
  description: z.string(),
  photo: z.string(),
  genres: z.array(z.string()),
  altTitles: z.array(z.object({
    title: z.string(),
    official: z.boolean(),
  })),
});

export type TAnimeInfo = z.infer<typeof AnimeInfoSchema>;
