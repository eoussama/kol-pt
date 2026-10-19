import type { TAnimeInfo } from "../../core/schemas/api/anime-info.schema";

import { animeInfoCacheItem } from "../../core/storage/items";
import { getPlaceholderUrl } from "../../core/utils/assets";
import { cachedEach } from "../cache";
import { getAniListInfo } from "./anilist";
import { getJikanInfo } from "./jikan";



/**
 * @description
 * How long anime details stay cached, in milliseconds. They rarely change.
 */
export const ANIME_INFO_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * @description
 * The key an anime is cached under: its AniList ID, else its MyAnimeList ID.
 *
 * @param ids - The anime's IDs, at least one of them
 * @param ids.malId - The anime's MyAnimeList ID
 * @param ids.anilistId - The anime's AniList ID
 * @returns The cache key
 */
export function animeKey(ids: { malId?: number; anilistId?: number }): string {
  return ids.anilistId ? `anilist:${ids.anilistId}` : `mal:${ids.malId}`;
}

/**
 * @description
 * Gets an anime's details: from AniList first, which is reliable and finds
 * anime by either ID, then from MyAnimeList through Jikan. Details found are
 * cached for a week.
 *
 * @param ids - The anime's IDs, at least one of them
 * @param ids.malId - The anime's MyAnimeList ID
 * @param ids.anilistId - The anime's AniList ID
 * @returns Promise resolving to the anime's details, or a placeholder when neither source has them
 */
export async function getAnimeInfo(ids: { malId?: number; anilistId?: number }): Promise<TAnimeInfo> {
  const key = animeKey(ids);
  const found = await cachedEach(animeInfoCacheItem, [key], async () => {
    const info = await getAniListInfo(ids) ?? (ids.malId ? await getJikanInfo(ids.malId) : null);

    return new Map(info ? [[key, info]] : []);
  }, { ttlMs: ANIME_INFO_TTL_MS });

  return found.get(key) ?? { genres: [], altTitles: [], description: "", photo: getPlaceholderUrl() };
}
