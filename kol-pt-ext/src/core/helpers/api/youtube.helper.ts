import { config } from '../../../config/env';
import { IconHelper } from '../asset/icon.helper';
import { IYouTubeInfo } from '../../types/api/youtube-info.type';
import { IYouTubeResponse } from '../../types/api/youtube-response.type';



/**
 * @description
 * Helps with retrieving info from YouTube.
 */
export class YouTubeHelper {

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
        .then((e: IYouTubeResponse) => {
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