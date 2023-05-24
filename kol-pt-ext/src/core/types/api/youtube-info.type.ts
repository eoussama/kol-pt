/**
 * @description
 * The YouTube info object
 */
export interface IYouTubeInfo {

  /**
   * @description
   * The description of the video.
   */
  description: string;

  /**
   * @description
   * The thumbnail of the video.
   */
  thumbnail: string;

  /**
   * @description
   * The view count of the video.
   */
  totlaViews?: number;

  /**
   * @description
   * The view count of the video.
   */
  subscribers?: number;
}