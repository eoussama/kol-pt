/**
 * @description
 * The HTTP reponse from the YouTube Data API.
 */
export interface IYouTubeResponse {

  /**
   * @description
   * Video information
   */
  snippet: {

    /**
     * @description
     * The video's description
     */
    description: string;

    /**
     * @description
     * The video's thumbnails
     */
    thumbnails: { standard: { url: string } };
  }

  /**
   * @description
   * Statistical information
   */
  statistics: {

    /**
     * @description
     * Total views on the video
     */
    viewCount: string;
  }
}