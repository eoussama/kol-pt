import { useEffect, useState } from 'react';
import { Entry } from '../core/models/entry.model';
import { Anime } from '../core/models/anime.model';
import { YouTube } from '../core/models/youtube.model';
import { EntryType } from '../core/enums/entry-type.enum';
import { JikanHelper } from '../core/helpers/api/jikan.helper';
import { YouTubeHelper } from '../core/helpers/api/youtube.helper';



/**
 * @description
 * Handles data fetching for the entry page.
 */
export function useEntry(entry: Entry) {
  const [loading, setLoading] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [description, setDescription] = useState('');
  const [genres, setGenres] = useState<Array<string>>([]);
  const [photo, setPhoto] = useState('./images/graphs/placeholder.jpg');

  useEffect(() => {
    if (entry.id) {
      setLoading(true);

      if (entry.type === EntryType.Anime) {
        JikanHelper
          .getAnimeInfo((entry as Anime).malId)
          .then(e => {
            setPhoto(e.photo);
            setGenres(e.genres);
            setDescription(e.description);
          })
          .finally(() => setLoading(false));
      } else if (entry.type === EntryType.YouTube) {
        YouTubeHelper
          .getVideoInfo((entry as YouTube).videoId)
          .then(e => {
            setPhoto(e.thumbnail);
            setViewCount(e.totlaViews);
            setDescription(e.description);
          })
          .finally(() => setLoading(false));
      }
    }
  }, [entry.id]);

  return { loading, photo, description, genres, viewCount };
}