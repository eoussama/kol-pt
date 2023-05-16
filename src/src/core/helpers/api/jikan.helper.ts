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
          console.log(e)
          resolve({
            description: e.synopsis,
            genres: e.genres.map(e => e.name),
            photo: e.images.webp.large_image_url
          });
        })
        .catch(() => {
          resolve({
            genres: [],
            description: '',
            photo: './images/graphs/placeholder.jpg',
          });
        });
    });
  }
}