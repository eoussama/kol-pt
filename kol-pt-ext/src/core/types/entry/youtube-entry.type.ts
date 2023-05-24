import { IEntry } from './entry.type';



/**
 * @description
 * Interface representing a YouTube video entry.
 */
export interface IYouTubeEntry extends IEntry {

  /**
   * @description
   * The YouTube channel handle.
   */
  handle: string;

  /**
   * @description
   * The YouTube channel ID.
   */
  channelId: string;
}
