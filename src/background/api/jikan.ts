import type { TAnimeInfo } from "../../core/schemas/api/anime-info.schema";

import { JikanResponseSchema } from "../../core/schemas/api/jikan-response.schema";
import { getPlaceholderUrl } from "../../core/utils/assets";



/**
 * @description
 * Gets an anime's details from MyAnimeList through the Jikan API.
 *
 * @param malId - The anime's MyAnimeList ID
 * @returns Promise resolving to the anime's details, or a placeholder on failure
 */
export async function getAnimeInfo(malId: number): Promise<TAnimeInfo> {
  const fallback: TAnimeInfo = { genres: [], altTitles: [], description: "", photo: getPlaceholderUrl() };

  try {
    const response = await fetch(`https://api.jikan.moe/v4/anime/${malId}`);
    const parsed = JikanResponseSchema.safeParse((await response.json())?.data);

    if (!parsed.success) {
      return fallback;
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
    return fallback;
  }
}
