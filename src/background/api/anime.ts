import type { TAnimeInfo } from "../../core/schemas/api/anime-info.schema";

import { getPlaceholderUrl } from "../../core/utils/assets";
import { getAniListInfo } from "./anilist";
import { getJikanInfo } from "./jikan";



/**
 * @description
 * Gets an anime's details: from AniList first, which is reliable and finds
 * anime by either ID, then from MyAnimeList through Jikan.
 *
 * @param ids - The anime's IDs, at least one of them
 * @param ids.malId - The anime's MyAnimeList ID
 * @param ids.anilistId - The anime's AniList ID
 * @returns Promise resolving to the anime's details, or a placeholder when neither source has them
 */
export async function getAnimeInfo(ids: { malId?: number; anilistId?: number }): Promise<TAnimeInfo> {
  const info = await getAniListInfo(ids) ?? (ids.malId ? await getJikanInfo(ids.malId) : null);

  return info ?? { genres: [], altTitles: [], description: "", photo: getPlaceholderUrl() };
}
