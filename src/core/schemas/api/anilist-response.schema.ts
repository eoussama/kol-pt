import { z } from "zod";



/**
 * @description
 * Zod schema for the anime details the AniList GraphQL API returns
 * (`data.Media`).
 */
export const AniListResponseSchema = z.object({
  title: z.object({
    romaji: z.string().nullable(),
    english: z.string().nullable(),
    native: z.string().nullable(),
  }),
  description: z.string().nullable(),
  genres: z.array(z.string()),
  coverImage: z.object({
    extraLarge: z.string().nullable(),
    large: z.string().nullable(),
  }),
});

export type TAniListResponse = z.infer<typeof AniListResponseSchema>;
