import type { TAnimeInfo } from "../../schemas/api/anime-info.schema";

import { JikanResponseSchema } from "../../schemas/api/jikan-response.schema";
import { getPlaceholderUrl } from "../../utils/assets";



/**
 * @description
 * Handles Jikan API calls
 */
export class JikanHelper {
  /**
   * @description
   * Gets info about an Anime using MAL's Jikan API.
   *
   * @param animeId - The MAL ID of the target anime
   * @returns Promise resolving to the anime info, or a placeholder on failure
   */
  static async getAnimeInfo(animeId: number): Promise<TAnimeInfo> {
    const fallback: TAnimeInfo = { genres: [], altTitles: [], description: "", photo: getPlaceholderUrl() };

    try {
      const response = await fetch(`https://api.jikan.moe/v4/anime/${animeId}`);
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
}
