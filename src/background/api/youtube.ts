import type { TYouTubeInfo } from "../../core/schemas/api/youtube-info.schema";

import { z } from "zod";
import { getYouTubeApiKey } from "../../config/env";
import { YouTubeChannelResponseSchema } from "../../core/schemas/api/youtube-channel-response.schema";
import { channelInfoCacheItem } from "../../core/storage/items";
import { getPlaceholderUrl } from "../../core/utils/assets";
import { cachedEach } from "../cache";



const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * @description
 * The most channels the YouTube Data API returns per request.
 */
const PAGE_SIZE = 50;

/**
 * @description
 * How long channel details stay cached, in milliseconds.
 */
export const CHANNEL_INFO_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * @description
 * Loads channels' details from the YouTube Data API, a page at a time.
 *
 * @param channelIds - The channels' IDs
 * @returns Promise resolving to the details found, by channel ID
 */
async function loadChannels(channelIds: ReadonlyArray<string>): Promise<Map<string, TYouTubeInfo>> {
  const channels = new Map<string, TYouTubeInfo>();
  const youtubeApiKey = getYouTubeApiKey();

  if (!youtubeApiKey) {
    return channels;
  }

  const pages = Array.from({ length: Math.ceil(channelIds.length / PAGE_SIZE) }, (_, i) => channelIds.slice(i * PAGE_SIZE, (i + 1) * PAGE_SIZE));

  await Promise.all(pages.map(async (ids) => {
    try {
      const url = new URL(`${YOUTUBE_API_BASE}/channels`);

      url.searchParams.set("part", "snippet,statistics");
      url.searchParams.set("id", ids.join(","));
      url.searchParams.set("key", youtubeApiKey);

      const response = await fetch(url);
      const parsed = z.array(z.unknown()).safeParse((await response.json())?.items);

      for (const item of parsed.success ? parsed.data : []) {
        const channel = YouTubeChannelResponseSchema.safeParse(item);

        if (channel.success) {
          channels.set(channel.data.id, {
            description: channel.data.snippet.description.trim(),
            thumbnail: channel.data.snippet.thumbnails.medium.url,
            subscribers: Number.parseInt(channel.data.statistics.subscriberCount, 10) || 0,
          });
        }
      }
    }
    catch {
      // Those channels are asked for again next time
    }
  }));

  return channels;
}

/**
 * @description
 * Gets YouTube channels' details, cached for a day.
 *
 * @param channelIds - The channels' IDs
 * @returns Promise resolving to the details found, by channel ID
 */
export function getChannelInfos(channelIds: ReadonlyArray<string>): Promise<Map<string, TYouTubeInfo>> {
  return cachedEach(channelInfoCacheItem, channelIds, loadChannels, { ttlMs: CHANNEL_INFO_TTL_MS });
}

/**
 * @description
 * Gets a YouTube channel's details from the YouTube Data API.
 *
 * @param channelId - The channel's ID
 * @returns Promise resolving to the channel's details, or a placeholder on failure
 */
export async function getChannelInfo(channelId: string): Promise<TYouTubeInfo> {
  const channels = await getChannelInfos([channelId]);

  return channels.get(channelId) ?? { subscribers: 0, totalViews: 0, description: "", thumbnail: getPlaceholderUrl() };
}
