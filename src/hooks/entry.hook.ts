import type { Entry } from "../core/domain/entry";
import type { IReaction } from "../core/domain/hydrate";
import type { TAnimeInfo } from "../core/schemas/api/anime-info.schema";

import { useEffect, useState } from "react";
import { Anime } from "../core/domain/anime";
import { YouTube } from "../core/domain/youtube";
import { JikanHelper } from "../core/helpers/api/jikan.helper";
import { YouTubeHelper } from "../core/helpers/api/youtube.helper";
import { EntriesHelper } from "../core/helpers/firebase/repositories/entries.helper";
import { PostsHelper } from "../core/helpers/firebase/repositories/posts.helper";
import { getPlaceholderUrl } from "../core/utils/assets";



/**
 * @description
 * An alternative title, official or used by KOL.
 */
export interface IAltTitle {
  title: string;
  official: boolean;
}

/**
 * @description
 * Everything the entry detail shows.
 */
export interface IEntryState {
  loading: boolean;
  entry: Entry | null;
  photo: string;
  description: string;
  subscribers: number;
  genres: Array<string>;
  altTitles: Array<IAltTitle>;
  reactions: Array<IReaction>;
}

/**
 * @description
 * The state before anything is loaded.
 *
 * @param entryId - The entry about to load, if any
 * @returns The initial state
 */
function initialState(entryId: string): IEntryState {
  return {
    loading: entryId.length > 0,
    entry: null,
    photo: getPlaceholderUrl(),
    description: "",
    subscribers: 0,
    genres: [],
    altTitles: [],
    reactions: [],
  };
}

/**
 * @description
 * Merges MyAnimeList's official titles with KOL's own, without duplicates or
 * the main title.
 *
 * @param info - The anime's MyAnimeList info
 * @param entry - The entry
 * @returns The alternative titles
 */
function mergeAltTitles(info: TAnimeInfo, entry: Entry): Array<IAltTitle> {
  const official = info.altTitles
    .map(alt => ({ ...alt, title: alt.title.trim() }))
    .filter(alt => alt.title.length > 0);
  const kol = entry.altTitles.map(title => ({ title, official: false }));

  return [...official, ...kol]
    .filter(alt => alt.title !== entry.title)
    .filter((alt, i, all) => all.findIndex(other => other.title === alt.title) === i);
}

/**
 * @description
 * Loads an entry's third-party details: MyAnimeList for anime, YouTube for
 * channels.
 *
 * @param entry - The entry
 * @returns The details to merge into the state
 */
async function loadDetails(entry: Entry): Promise<Partial<IEntryState>> {
  if (entry instanceof Anime && entry.malId > 0) {
    const info = await JikanHelper.getAnimeInfo(entry.malId);

    return { photo: info.photo, genres: info.genres, description: info.description, altTitles: mergeAltTitles(info, entry) };
  }

  if (entry instanceof YouTube) {
    const info = await YouTubeHelper.getChannelInfo(entry.channelId);

    return { photo: info.thumbnail, description: info.description, subscribers: info.subscribers ?? 0 };
  }

  return {};
}

/**
 * @description
 * Handles data fetching for the entry detail: the entry and its reactions
 * first, then its third-party details.
 *
 * @param entryId - The ID of the entry
 * @returns Entry state including loading, entry data, media info, and reactions
 */
export function useEntry(entryId: string): IEntryState {
  const [state, setState] = useState<IEntryState>(() => initialState(entryId));

  useEffect(() => {
    let cancelled = false;
    const update = (patch: Partial<IEntryState>) => {
      if (!cancelled) {
        setState(current => ({ ...current, ...patch }));
      }
    };

    setState(initialState(entryId));

    if (entryId) {
      (async () => {
        const [entry, reactions] = await Promise.all([EntriesHelper.get(entryId), PostsHelper.getReactions(entryId)]);

        update({ entry: entry ?? null, reactions });

        if (entry) {
          update(await loadDetails(entry));
        }
      })()
        .catch(() => undefined)
        .finally(() => update({ loading: false }));
    }

    return () => {
      cancelled = true;
    };
  }, [entryId]);

  return state;
}
