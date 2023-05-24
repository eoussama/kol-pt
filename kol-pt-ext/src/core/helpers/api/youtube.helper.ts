import { config } from '../../../config/env';
import { IconHelper } from '../asset/icon.helper';
import { IYouTubeInfo } from '../../types/api/youtube-info.type';
import { IYouTubeVideoResponse } from '../../types/api/youtube-video-response.type';
import { IYouTubeChannelResponse } from '../../types/api/youtube-channel-response.type';



/**
 * @description
 * Helps with retrieving info from YouTube.
 */
export class YouTubeHelper {

  /**
   * @description
   * Fetches info about a certain YouTube channel.
   *
   * @param channelID The ID of the channel to fetch the info of.
   */
  static getChannelInfo(channelId: string): Promise<IYouTubeInfo> {
    return new Promise(resolve => {
      fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet%2Cstatistics&id=${channelId}&key=${config.youtubeApiKey}`)
        .then(e => e.json())
        .then(e => e.items[0])
        .then((e: IYouTubeChannelResponse) => {
          resolve({
            description: e.snippet.description.trim(),
            thumbnail: e.snippet.thumbnails.medium.url,
            subscribers: parseInt(e.statistics.subscriberCount)
          });
        })
        .catch(() => {
          resolve({
            subscribers: 0,
            description: '',
            thumbnail: IconHelper.getIcon('placeholder', 'graphs')
          });
        });
    });
  }

  /**
   * @description
   * Fetches info about a certain YouTube video.
   *
   * @param videoId The ID of the video to fetch the info of.
   */
  static getVideoInfo(videoId: string): Promise<IYouTubeInfo> {
    return new Promise(resolve => {
      fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet%2Cstatistics&id=${videoId}&key=${config.youtubeApiKey}`)
        .then(e => e.json())
        .then(e => e.items[0])
        .then((e: IYouTubeVideoResponse) => {
          resolve({
            description: e.snippet.description,
            thumbnail: e.snippet.thumbnails.standard.url,
            totlaViews: parseInt(e.statistics.viewCount)
          });
        })
        .catch(() => {
          resolve({
            totlaViews: 0,
            description: '',
            thumbnail: IconHelper.getIcon('placeholder', 'graphs')
          });
        });
    });
  }
}