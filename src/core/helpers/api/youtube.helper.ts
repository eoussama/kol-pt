import type { TYouTubeInfo } from "../../schemas/api/youtube-info.schema";
import { config } from "../../../config/env";
import { YouTubeChannelResponseSchema } from "../../schemas/api/youtube-channel-response.schema";
import { YouTubeVideoResponseSchema } from "../../schemas/api/youtube-video-response.schema";
import { IconHelper } from "../asset/icon.helper";



const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

const FALLBACK_INFO: TYouTubeInfo = {
  subscribers: 0,
  totalViews: 0,
  description: "",
  thumbnail: IconHelper.getIcon("placeholder", "graphs"),
};

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
  static getChannelInfo(channelId: string): Promise<TYouTubeInfo> {
    return new Promise((resolve) => {
      fetch(`${YOUTUBE_API_BASE}/channels?part=snippet%2Cstatistics&id=${channelId}&key=${config.youtubeApiKey}`)
        .then(e => e.json())
        .then(e => e.items[0])
        .then((raw: unknown) => {
          const parsed = YouTubeChannelResponseSchema.safeParse(raw);

          if (!parsed.success) {
            resolve(FALLBACK_INFO);

            return;
          }

          const e = parsed.data;

          resolve({
            description: e.snippet.description.trim(),
            thumbnail: e.snippet.thumbnails.medium.url,
            subscribers: Number.parseInt(e.statistics.subscriberCount),
          });
        })
        .catch(() => resolve(FALLBACK_INFO));
    });
  }

  /**
   * @description
   * Fetches info about a certain YouTube video.
   *
   * @param videoId - The ID of the video to fetch the info of
   * @returns Promise resolving to the video info
   */
  static getVideoInfo(videoId: string): Promise<TYouTubeInfo> {
    return new Promise((resolve) => {
      fetch(`${YOUTUBE_API_BASE}/videos?part=snippet%2Cstatistics&id=${videoId}&key=${config.youtubeApiKey}`)
        .then(e => e.json())
        .then(e => e.items[0])
        .then((raw: unknown) => {
          const parsed = YouTubeVideoResponseSchema.safeParse(raw);

          if (!parsed.success) {
            resolve(FALLBACK_INFO);

            return;
          }

          const e = parsed.data;

          resolve({
            description: e.snippet.description,
            thumbnail: e.snippet.thumbnails.standard.url,
            totalViews: Number.parseInt(e.statistics.viewCount),
          });
        })
        .catch(() => resolve(FALLBACK_INFO));
    });
  }
}
