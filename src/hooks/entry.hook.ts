import type { Entry } from "../core/domain/entry";
import type { IReaction } from "../core/domain/hydrate";

import { useEffect, useState } from "react";
import { Anime } from "../core/domain/anime";
import { createEntry, findReactions, hydratePosts } from "../core/domain/hydrate";
import { YouTube } from "../core/domain/youtube";
import { request } from "../core/messaging/client";
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
 * The entries already shown, kept while the page is open so they show at
 * once when opened again.
 */
const shownEntries = new Map<string, IEntryState>();

/**
 * @description
 * The state before anything is loaded, or the one an entry last showed.
 *
 * @param entryId - The entry about to load, if any
 * @returns The initial state
 */
function initialState(entryId: string): IEntryState {
  return shownEntries.get(entryId) ?? {
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
 * Merges an entry's official titles, from AniList or MyAnimeList, with KOL's
 * own, without duplicates or the main title.
 *
 * @param entry - The entry
 * @param officialTitles - Its official titles, if any are known
 * @returns The alternative titles
 */
export function mergeAltTitles(entry: Entry, officialTitles: ReadonlyArray<IAltTitle> = []): Array<IAltTitle> {
  const official = officialTitles
    .map(alt => ({ ...alt, title: alt.title.trim() }))
    .filter(alt => alt.title.length > 0);
  const kol = entry.altTitles.map(title => ({ title, official: false }));

  return [...official, ...kol]
    .filter(alt => alt.title !== entry.title)
    .filter((alt, i, all) => all.findIndex(other => other.title === alt.title) === i);
}

/**
 * @description
 * Loads an entry's third-party details: AniList or MyAnimeList for anime,
 * YouTube for channels.
 *
 * @param entry - The entry
 * @returns The details to merge into the state
 */
async function loadDetails(entry: Entry): Promise<Partial<IEntryState>> {
  if (entry instanceof Anime && (entry.malId > 0 || entry.anilistId > 0)) {
    const info = await request("anime.info", {
      ...(entry.malId > 0 && { malId: entry.malId }),
      ...(entry.anilistId > 0 && { anilistId: entry.anilistId }),
    });

    return { photo: info.photo, genres: info.genres, description: info.description, altTitles: mergeAltTitles(entry, info.altTitles) };
  }

  if (entry instanceof YouTube && entry.channelId) {
    const info = await request("youtube.channel", { channelId: entry.channelId });

    return { photo: info.thumbnail, description: info.description, subscribers: info.subscribers ?? 0 };
  }

  return {};
}

/**
 * @description
 * Loads everything the entry detail shows: the entry and its reactions, then
 * its third-party details (cached by the background).
 *
 * @param entryId - The ID of the entry
 * @returns Promise resolving to the loaded state
 */
async function loadEntry(entryId: string): Promise<IEntryState> {
  const { posts, entries } = await request("posts.list", {});
  const data = entries.find(candidate => candidate.id === entryId);
  const entry = data ? createEntry(data) : null;
  const state: IEntryState = { ...initialState(""), loading: false, entry };

  if (!entry) {
    return state;
  }

  const { photo, ...details } = await loadDetails(entry).catch((): Partial<IEntryState> => ({}));

  return {
    ...state,
    reactions: findReactions(hydratePosts(posts, entries), entryId),
    altTitles: mergeAltTitles(entry),
    ...details,
    // An entry's own cover wins over the one a third party provides
    photo: entry.cover || photo || state.photo,
  };
}

/**
 * @description
 * Handles data fetching for the entry detail. An entry already shown while
 * the page is open shows at once, and is refreshed quietly.
 *
 * @param entryId - The ID of the entry
 * @param revision - Changed to load the entry again, e.g. once it is edited
 * @returns Entry state including loading, entry data, media info, and reactions
 */
export function useEntry(entryId: string, revision = 0): IEntryState {
  const [state, setState] = useState<IEntryState>(() => initialState(entryId));

  useEffect(() => {
    let cancelled = false;

    setState(initialState(entryId));

    if (entryId) {
      loadEntry(entryId)
        .then((loaded) => {
          if (loaded.entry) {
            shownEntries.set(entryId, loaded);
          }

          if (!cancelled) {
            setState(loaded);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setState(current => ({ ...current, loading: false }));
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [entryId, revision]);

  return state;
}
