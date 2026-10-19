import type { TEntry } from "../../core/schemas/entry/entry.schema";

import { EEntryType } from "../../core/enums/entry-type.enum";
import { animeInfoCacheItem, coversCacheItem } from "../../core/storage/items";
import { cachedEach } from "../cache";
import { getAniListCovers } from "./anilist";
import { ANIME_INFO_TTL_MS, animeKey } from "./anime";
import { getChannelInfos } from "./youtube";



/**
 * @description
 * Loads anime covers by cache key, reusing the details already cached for an
 * anime's page before asking AniList for the rest at once.
 *
 * @param keys - The anime's cache keys, `anilist:<id>` or `mal:<id>`
 * @returns Promise resolving to the covers found, by key
 */
async function loadAnimeCovers(keys: Array<string>): Promise<Map<string, string>> {
  const details = await animeInfoCacheItem.getValue();
  const covers = new Map<string, string>();
  const rest: Array<string> = [];

  keys.forEach((key) => {
    const photo = details[key]?.data.photo;

    if (photo?.startsWith("https://")) {
      covers.set(key, photo);
    }
    else {
      rest.push(key);
    }
  });

  const ids = (prefix: string) => rest.filter(key => key.startsWith(prefix)).map(key => Number(key.slice(prefix.length)));
  const found = rest.length > 0 ? await getAniListCovers({ anilistIds: ids("anilist:"), malIds: ids("mal:") }) : new Map<string, string>();

  rest.forEach((key) => {
    const cover = found.get(key);

    if (cover) {
      covers.set(key, cover);
    }
  });

  return covers;
}

/**
 * @description
 * Finds a thumbnail for each entry without a cover of its own: anime from
 * AniList, YouTube channels from YouTube. Both are cached.
 *
 * @param entries - The entries
 * @returns Promise resolving to the thumbnails found, by entry ID
 */
export async function getEntryCovers(entries: ReadonlyArray<TEntry>): Promise<Record<string, string>> {
  const animeKeys = new Map<string, string>();
  const channelIds = new Map<string, string>();

  for (const entry of entries) {
    if (entry.cover) {
      continue;
    }

    if (entry.type === EEntryType.ANIME) {
      const anilistId = (entry.anilistId ?? 0) > 0 ? entry.anilistId : undefined;
      const malId = (entry.malId ?? 0) > 0 ? entry.malId : undefined;

      if (anilistId || malId) {
        animeKeys.set(entry.id, animeKey({ anilistId, malId }));
      }
    }
    else if (entry.type === EEntryType.YOUTUBE && entry.channelId) {
      channelIds.set(entry.id, entry.channelId);
    }
  }

  const [anime, channels] = await Promise.all([
    cachedEach(coversCacheItem, [...animeKeys.values()], loadAnimeCovers, { ttlMs: ANIME_INFO_TTL_MS }),
    getChannelInfos([...channelIds.values()]),
  ]);

  const covers: Record<string, string> = {};

  animeKeys.forEach((key, entryId) => {
    const cover = anime.get(key);

    if (cover) {
      covers[entryId] = cover;
    }
  });
  channelIds.forEach((channelId, entryId) => {
    const thumbnail = channels.get(channelId)?.thumbnail;

    if (thumbnail) {
      covers[entryId] = thumbnail;
    }
  });

  return covers;
}
