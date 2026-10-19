import type { TAnimeInfo } from "../../core/schemas/api/anime-info.schema";

import { JikanResponseSchema } from "../../core/schemas/api/jikan-response.schema";



/**
 * @description
 * How long to wait for Jikan, in milliseconds. It is often slow or down.
 */
const TIMEOUT_MS = 8000;

/**
 * @description
 * Gets an anime's details from MyAnimeList through the Jikan API.
 *
 * @param malId - The anime's MyAnimeList ID
 * @returns Promise resolving to the anime's details, or null if Jikan has none or does not answer
 */
export async function getJikanInfo(malId: number): Promise<TAnimeInfo | null> {
  try {
    const response = await fetch(`https://api.jikan.moe/v4/anime/${malId}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    const parsed = JikanResponseSchema.safeParse((await response.json())?.data);

    if (!parsed.success) {
      return null;
    }

    const anime = parsed.data;

    return {
      description: anime.synopsis,
      genres: anime.genres.map(genre => genre.name),
      photo: anime.images.webp.large_image_url,
      altTitles: [
        { title: anime.title, official: true },
        { title: anime.title_english ?? "", official: true },
        { title: anime.title_japanese ?? "", official: true },
      ],
    };
  }
  catch {
    return null;
  }
}
