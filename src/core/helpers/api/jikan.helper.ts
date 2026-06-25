import type { TAnimeInfo } from "../../schemas/api/anime-info.schema";
import { JikanResponseSchema } from "../../schemas/api/jikan-response.schema";
import { IconHelper } from "../asset/icon.helper";



const FALLBACK: TAnimeInfo = {
  genres: [],
  altTitles: [],
  description: "",
  photo: IconHelper.getIcon("placeholder", "graphs"),
};

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
   * @returns Promise resolving to the anime info
   */
  static getAnimeInfo(animeId: number): Promise<TAnimeInfo> {
    return new Promise((resolve) => {
      fetch(`https://api.jikan.moe/v4/anime/${animeId}`)
        .then(e => e.json())
        .then(e => e.data)
        .then((raw: unknown) => {
          const parsed = JikanResponseSchema.safeParse(raw);

          if (!parsed.success) {
            resolve(FALLBACK);

            return;
          }

          const e = parsed.data;

          resolve({
            description: e.synopsis,
            genres: e.genres.map(g => g.name),
            photo: e.images.webp.large_image_url,
            altTitles: [
              { title: e.title, official: true },
              { title: e.title_english ?? "", official: true },
              { title: e.title_japanese ?? "", official: true },
            ],
          });
        })
        .catch(() => resolve(FALLBACK));
    });
  }
}
