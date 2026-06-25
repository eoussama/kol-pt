import type { TUnsafe } from "@eoussama/core";
import type { Anime } from "../core/models/anime.model";
import type { Entry } from "../core/models/entry.model";
import type { YouTube } from "../core/models/youtube.model";
import type { IAnimeInfo } from "../core/types/api/anime-info.type";
import type { IReaction } from "../core/types/reaction.type";
import { useEffect, useState } from "react";
import { EEntryType } from "../core/enums/entry-type.enum";
import { JikanHelper } from "../core/helpers/api/jikan.helper";
import { YouTubeHelper } from "../core/helpers/api/youtube.helper";
import { IconHelper } from "../core/helpers/asset/icon.helper";
import { EntriesHelper } from "../core/helpers/firebase/repositories/entries.helper";



/**
 * @description
 * Handles data fetching for the entry page.
 *
 * @param entryId - The ID of the entry
 * @returns Entry state including loading, entry data, media info, and reactions
 */
export function useEntry(entryId: string) {
  const [loading, setLoading] = useState(false);
  const [subscribers, setSubscribers] = useState(0);
  const [description, setDescription] = useState("");
  const [genres, setGenres] = useState<Array<string>>([]);
  const [entry, setEntry] = useState<TUnsafe<Entry>>(null);
  const [reactions, setReactions] = useState<Array<IReaction>>([]);
  const [photo, setPhoto] = useState(IconHelper.getIcon("placeholder", "graphs"));
  const [altTitles, setAltTitles] = useState<Array<{ title: string; official: boolean }>>([]);

  /**
   * @description
   * Sanitizes alternative titles of an entry.
   *
   * @param animeInfo - The Anime MAL info
   * @param entry - The target entry
   * @returns Merged and deduplicated array of alternative titles
   */
  const sanitizeAltTitles = (animeInfo: IAnimeInfo, entry: Entry) => {
    // Sanitizing MAL's alt titles
    const officialAltTitles = animeInfo.altTitles
      .map(e => ({ ...e, title: e.title?.toString()?.trim() ?? "" }))
      .filter(e => e.title?.length > 0);

    // Mapping KOL's own alt titles
    const kolAltTitles = entry.altTitles.map(e => ({ title: e, official: false }));

    // Merging alt titles and removing duplicates
    const mergedAltTitles = [...officialAltTitles, ...kolAltTitles]
      .filter(e => e.title !== entry.title)
      .filter((altTitle, i, tmp) => tmp.findIndex(e => e.title === altTitle.title) === i);

    return mergedAltTitles;
  };

  useEffect(() => {
    if (entryId) {
      setLoading(true);
      setEntry(null);
      setReactions([]);
      setDescription("");
      setGenres([]);
      setAltTitles([]);
      setSubscribers(0);
      setPhoto(IconHelper.getIcon("placeholder", "graphs"));

      EntriesHelper.get(entryId)
        .then((entry) => {
          setEntry(entry);

          if (entry?.type === EEntryType.ANIME) {
            const malId = (entry as Anime).malId;

            if (malId <= 0) {
              EntriesHelper.getReactions(entryId).then(setReactions);
              setLoading(false);

              return;
            }

            JikanHelper
              .getAnimeInfo(malId)
              .then((e) => {
                setPhoto(e.photo);
                setGenres(e.genres);
                setDescription(e.description);
                setAltTitles(sanitizeAltTitles(e, entry));
                EntriesHelper.getReactions(entryId).then(setReactions);
              })
              .finally(() => setLoading(false));
          }
          else if (entry?.type === EEntryType.YOUTUBE) {
            YouTubeHelper
              .getChannelInfo((entry as YouTube).channelId)
              .then((e) => {
                setAltTitles([]);
                setPhoto(e.thumbnail);
                setDescription(e.description);
                setSubscribers(e.subscribers ?? 0);
                EntriesHelper.getReactions(entryId).then(setReactions);
              })
              .finally(() => setLoading(false));
          }
          else {
            setLoading(false);
          }
        });
    }
  }, [entryId]);

  return { loading, entry, photo, description, subscribers, genres, altTitles, reactions };
}
