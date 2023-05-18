import { IconHelper } from '../asset/icon.helper';
import { IAnimeInfo } from '../../types/api/anime-info.type';
import { IJikanResponse } from '../../types/api/jikan-response.type';



/**
 * @description
 * Handles Jikan API calls
 */
export class JikanHelper {

  /**
   * @description
   * Gets info about an Anime using MAL's Jikan API.
   *
   * @param animeId The MAL ID of the target anime
   */
  static getAnimeInfo(animeId: number): Promise<IAnimeInfo> {
    return new Promise(resolve => {
      fetch(`https://api.jikan.moe/v4/anime/${animeId}`)
        .then(e => e.json())
        .then(e => e.data)
        .then((e: IJikanResponse) => {
          resolve({
            description: e.synopsis,
            genres: e.genres.map(e => e.name),
            photo: e.images.webp.large_image_url,
            altTitles: [
              { title: e.title, official: true },
              { title: e.title_english, official: true },
              { title: e.title_english, official: true }
            ]
          });
        })
        .catch(() => {
          resolve({
            genres: [],
            altTitles: [],
            description: '',
            photo: IconHelper.getIcon('placeholder', 'graphs'),
          });
        });
    });
  }
}