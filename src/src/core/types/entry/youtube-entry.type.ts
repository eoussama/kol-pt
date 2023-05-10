import { IEntry } from "./entry.type";



/**
 * @description
 * Interface representing a YouTube video entry.
 */
export interface IYouTubeEntry extends IEntry {

  /**
   * @description
   * The ID of the YouTube video.
   */
  videoId: string;

  /**
   * @description
   * The YouTube channel handle id.
   */
  channelId: string;

  /**
   * @description
   * The name of the YouTube channel that uploaded the video.
   */
  channelName: string;
}
