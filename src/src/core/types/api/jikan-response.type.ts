/**
 * @description
 * The HTTP reponse from Jikan API for
 * a target anime.
 */
export interface IJikanResponse {

  /**
   * @description
   * The synopsis of the Anime
   */
  synopsis: string;

  /**
   * @description
   * Associated Anime images
   */
  images: { webp: { large_image_url: string } };

  /**
   * @description
   * The list of genres
   */
  genres: Array<{ name: string }>;
}