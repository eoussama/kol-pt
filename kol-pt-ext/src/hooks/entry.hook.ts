import { useEffect, useState } from 'react';
import { Entry } from '../core/models/entry.model';
import { Anime } from '../core/models/anime.model';
import { Nullable } from '../core/types/nullable.type';
import { YouTube } from '../core/models/youtube.model';
import { IReaction } from '../core/types/reaction.type';
import { EntryType } from '../core/enums/entry-type.enum';
import { JikanHelper } from '../core/helpers/api/jikan.helper';
import { IAnimeInfo } from '../core/types/api/anime-info.type';
import { IconHelper } from '../core/helpers/asset/icon.helper';
import { YouTubeHelper } from '../core/helpers/api/youtube.helper';
import { EntriesHelper } from '../core/helpers/firebase/entries.helper';



/**
 * @description
 * Handles data fetching for the entry page.
 *
 * @param entryId The ID of the entry.
 */
export function useEntry(entryId: string) {
  const [loading, setLoading] = useState(false);
  const [subscribers, setSubscribers] = useState(0);
  const [description, setDescription] = useState('');
  const [genres, setGenres] = useState<Array<string>>([]);
  const [entry, setEntry] = useState<Nullable<Entry>>(null);
  const [reactions, setReactions] = useState<Array<IReaction>>([]);
  const [photo, setPhoto] = useState(IconHelper.getIcon('placeholder', 'graphs'));
  const [altTitles, setAltTitles] = useState<Array<{ title: string, official: boolean }>>([]);

  /**
   * @description
   * Sanitizes alternative titles of an entry.
   *
   * @param animeInfo The Anime MAL info
   * @param entry The target entry
   */
  const sanitizeAltTitles = (animeInfo: IAnimeInfo, entry: Entry) => {

    // Sanitizing MAL's alt titles
    const officialAltTitles = animeInfo.altTitles
      .map(e => ({ ...e, title: e.title?.toString()?.trim() ?? '' }))
      .filter(e => e.title?.length > 0)

    // Mapping KOL's own alt titles
    const kolAltTitles = entry.altTitles.map(e => ({ title: e, official: false }));

    // Merging alt titles and removing duplicates
    const mergedAltTitles = [...officialAltTitles, ...kolAltTitles]
      .filter(e => e.title !== entry.title)
      .filter((altTitle, i, tmp) => tmp.findIndex(e => e.title === altTitle.title) === i);

    return mergedAltTitles;
  }

  useEffect(() => {
    if (entryId) {
      setLoading(true);

      EntriesHelper.get(entryId)
        .then(entry => {
          setEntry(entry);

          if (entry?.type === EntryType.Anime) {
            JikanHelper
              .getAnimeInfo((entry as Anime).malId)
              .then(e => {
                setPhoto(e.photo);
                setGenres(e.genres);
                setDescription(e.description);
                setAltTitles(sanitizeAltTitles(e, entry));
                EntriesHelper.getReactions(entryId).then(setReactions);
              })
              .finally(() => setLoading(false));
          } else if (entry?.type === EntryType.YouTube) {
            YouTubeHelper
            .getChannelInfo((entry as YouTube).channelId)
            .then(e => {
                setAltTitles([]);
                setPhoto(e.thumbnail);
                setDescription(e.description);
                setSubscribers(e.subscribers ?? 0);
                EntriesHelper.getReactions(entryId).then(setReactions);
              })
              .finally(() => setLoading(false));
          } else {
            setLoading(false);
          }
        });
    }
  }, [entryId]);

  return { loading, entry, photo, description, subscribers, genres, altTitles, reactions };
}