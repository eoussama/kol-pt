import type { TYouTubeInfo } from "../../schemas/api/youtube-info.schema";

import { getConfig } from "../../../config/env";
import { YouTubeChannelResponseSchema } from "../../schemas/api/youtube-channel-response.schema";
import { getPlaceholderUrl } from "../../utils/assets";



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
   * @returns Promise resolving to the channel info, or a placeholder on failure
   */
  static async getChannelInfo(channelId: string): Promise<TYouTubeInfo> {
    const fallback: TYouTubeInfo = { subscribers: 0, totalViews: 0, description: "", thumbnail: getPlaceholderUrl() };

    if (!channelId) {
      return fallback;
    }

    try {
      const url = new URL(`${YOUTUBE_API_BASE}/channels`);

      url.searchParams.set("part", "snippet,statistics");
      url.searchParams.set("id", channelId);
      url.searchParams.set("key", getConfig().youtubeApiKey);

      const response = await fetch(url);
      const parsed = YouTubeChannelResponseSchema.safeParse((await response.json())?.items?.[0]);

      if (!parsed.success) {
        return fallback;
      }

      const channel = parsed.data;

      return {
        description: channel.snippet.description.trim(),
        thumbnail: channel.snippet.thumbnails.medium.url,
        subscribers: Number.parseInt(channel.statistics.subscriberCount, 10) || 0,
      };
    }
    catch {
      return fallback;
    }
  }
}
