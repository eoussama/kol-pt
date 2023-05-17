import { useEffect, useState } from 'react';
import { Entry } from '../core/models/entry.model';
import { Anime } from '../core/models/anime.model';
import { Nullable } from '../core/types/nullable.type';
import { YouTube } from '../core/models/youtube.model';
import { EntryType } from '../core/enums/entry-type.enum';
import { JikanHelper } from '../core/helpers/api/jikan.helper';
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
  const [viewCount, setViewCount] = useState(0);
  const [description, setDescription] = useState('');
  const [genres, setGenres] = useState<Array<string>>([]);
  const [entry, setEntry] = useState<Nullable<Entry>>(null);
  const [photo, setPhoto] = useState('./images/graphs/placeholder.jpg');
  const [altTitles, setAltTitles] = useState<Array<{ title: string, official: boolean }>>([]);

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

                // Sanitizing MAL's alt titles
                const officialAltTitles = e.altTitles
                  .map(e => ({ ...e, title: e.title?.toString()?.trim() ?? '' }))
                  .filter(e => e.title?.length > 0)
                  .filter(e => e.title !== entry.title);

                // Mapping KOL's own alt titles
                const kolAltTitles = entry.altTitles.map(e => ({ title: e, official: false }));

                // Merging alt titles and removing duplicates
                const mergedAltTitles = [...officialAltTitles, ...kolAltTitles]
                  .filter((altTitle, i, tmp) => tmp.findIndex(e => e.title === altTitle.title) === i);

                setAltTitles(mergedAltTitles);
              })
              .finally(() => setLoading(false));
          } else if (entry?.type === EntryType.YouTube) {
            YouTubeHelper
              .getVideoInfo((entry as YouTube).videoId)
              .then(e => {
                setPhoto(e.thumbnail);
                setViewCount(e.totlaViews);
                setDescription(e.description);
              })
              .finally(() => setLoading(false));
          } else {
            setLoading(false);
          }
        });
    }
  }, [entryId]);

  return { loading, entry, photo, description, genres, viewCount, altTitles };
}