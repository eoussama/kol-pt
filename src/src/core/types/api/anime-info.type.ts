/**
 * @description
 * The Anime response from the Jikan helper.
 */
export interface IAnimeInfo {

  /**
   * @description
   * The description of the Anime.
   */
  description: string;

  /**
   * @description
   * The photo of the Anime.
   */
  photo: string;

  /**
   * @description
   * The list of genres
   */
  genres: Array<string>;
}