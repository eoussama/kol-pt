import { IEntry } from "./entry.type";



/**
 * @description
 * Interface representing a YouTube video entry.
 */
export interface IYouTubeEntry extends IEntry {

  /**
   * @description
   * The URL of the YouTube video.
   */
  videoUrl: string;

  /**
   * @description
   * The URL of the YouTube channel that uploaded the video.
   */
  channelUrl: string;

  /**
   * @description
   * The name of the YouTube channel that uploaded the video.
   */
  channelName: string;
}
