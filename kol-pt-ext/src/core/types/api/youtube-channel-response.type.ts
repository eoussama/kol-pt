/**
 * @description
 * The channel HTTP reponse from the YouTube Data API.
 */
export interface IYouTubeChannelResponse {

  /**
   * @description
   * channel information
   */
  snippet: {

    /**
     * @description
     * The channel's description
     */
    description: string;

    /**
     * @description
     * The channel's thumbnails
     */
    thumbnails: { medium: { url: string } };
  }

  /**
   * @description
   * Statistical information
   */
  statistics: {

    /**
     * @description
     * Total subscribers
     */
    subscriberCount: string;
  }
}