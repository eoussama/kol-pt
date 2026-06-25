import type { IYouTubeChannelResponse } from "../../types/api/youtube-channel-response.type";
import type { IYouTubeInfo } from "../../types/api/youtube-info.type";
import type { IYouTubeVideoResponse } from "../../types/api/youtube-video-response.type";
import { config } from "../../../config/env";
import { IconHelper } from "../asset/icon.helper";



const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * @description
 * Helps with retrieving info from YouTube.
 */
export class YouTubeHelper {
  /**
   * @description
   * Fetches info about a certain YouTube channel.
   *
   * @param channelId - The ID of the channel to fetch the info of
   * @returns Promise resolving to the channel info
   */
  static getChannelInfo(channelId: string): Promise<IYouTubeInfo> {
    return new Promise((resolve) => {
      fetch(`${YOUTUBE_API_BASE}/channels?part=snippet%2Cstatistics&id=${channelId}&key=${config.youtubeApiKey}`)
        .then(e => e.json())
        .then(e => e.items[0])
        .then((e: IYouTubeChannelResponse) => {
          resolve({
            description: e.snippet.description.trim(),
            thumbnail: e.snippet.thumbnails.medium.url,
            subscribers: Number.parseInt(e.statistics.subscriberCount),
          });
        })
        .catch(() => {
          resolve({
            subscribers: 0,
            description: "",
            thumbnail: IconHelper.getIcon("placeholder", "graphs"),
          });
        });
    });
  }

  /**
   * @description
   * Fetches info about a certain YouTube video.
   *
   * @param videoId - The ID of the video to fetch the info of
   * @returns Promise resolving to the video info
   */
  static getVideoInfo(videoId: string): Promise<IYouTubeInfo> {
    return new Promise((resolve) => {
      fetch(`${YOUTUBE_API_BASE}/videos?part=snippet%2Cstatistics&id=${videoId}&key=${config.youtubeApiKey}`)
        .then(e => e.json())
        .then(e => e.items[0])
        .then((e: IYouTubeVideoResponse) => {
          resolve({
            description: e.snippet.description,
            thumbnail: e.snippet.thumbnails.standard.url,
            totalViews: Number.parseInt(e.statistics.viewCount),
          });
        })
        .catch(() => {
          resolve({
            totalViews: 0,
            description: "",
            thumbnail: IconHelper.getIcon("placeholder", "graphs"),
          });
        });
    });
  }
}
