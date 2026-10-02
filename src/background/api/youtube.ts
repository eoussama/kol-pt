import type { TYouTubeInfo } from "../../core/schemas/api/youtube-info.schema";

import { getYouTubeApiKey } from "../../config/env";
import { YouTubeChannelResponseSchema } from "../../core/schemas/api/youtube-channel-response.schema";
import { getPlaceholderUrl } from "../../core/utils/assets";



const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * @description
 * Gets a YouTube channel's details from the YouTube Data API.
 *
 * @param channelId - The channel's ID
 * @returns Promise resolving to the channel's details, or a placeholder on failure
 */
export async function getChannelInfo(channelId: string): Promise<TYouTubeInfo> {
  const fallback: TYouTubeInfo = { subscribers: 0, totalViews: 0, description: "", thumbnail: getPlaceholderUrl() };
  const youtubeApiKey = getYouTubeApiKey();

  if (!youtubeApiKey) {
    return fallback;
  }

  try {
    const url = new URL(`${YOUTUBE_API_BASE}/channels`);

    url.searchParams.set("part", "snippet,statistics");
    url.searchParams.set("id", channelId);
    url.searchParams.set("key", youtubeApiKey);

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
