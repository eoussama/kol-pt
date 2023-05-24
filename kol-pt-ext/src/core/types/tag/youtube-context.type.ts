/**
 * @description
 * The YouTube context
 */
export interface IYouTubeContext {

  /**
   * @description
   * The video's title
   */
  title: string;

  /**
   * @description
   * The video ID
   */
  videoId?: string;

  /**
   * @description
   * Alternative titles
   */
  altTitles?: Array<string>;
}