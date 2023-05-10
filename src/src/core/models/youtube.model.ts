import { Entry } from "./entry.model";
import { IOption } from "../types/option.type";
import { EntryType } from "../enums/entry-type.enum";
import { IconHelper } from "../helpers/asset/icon.helper";
import { IYouTubeEntry } from "../types/entry/youtube-entry.type";
import { NavigationHelper } from "../helpers/navigator/navigation.helper";



/**
 * @description
 * Represents a YouTube Entry which extends the base class 
 */
export class YouTube extends Entry {

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

  /**
   * @constructor
   * @param model The youtube entry model. 
   */
  constructor(model?: IYouTubeEntry) {
    super(model);

    this.type = EntryType.YouTube;
    this.videoId = model?.videoId ?? '';
    this.channelId = model?.channelId ?? '';
    this.channelName = model?.channelName ?? '';
  }

  /**
   * @description
   * Opens the YouTube video.
   */
  watchVideo(): void {
    NavigationHelper.openYoutubeVideo(this.videoId);
  }

  /**
   * @description
   * Opens the YouTube video.
   */
  openChannel(): void {
    NavigationHelper.openYoutubeChannel(this.channelId);
  }

  /**
 * @description
 * Gets the list of menu options
 *
 * @param context The parent tag's context, passed for extra context
 */
  getOptions(): Array<IOption> {
    const options = super.getOptions();

    return [
      {
        divider: true,
        canShow: () => true,
        iconAlt: 'YouTube icon',
        label: 'Watch on YouTube',
        action: this.watchVideo.bind(this),
        icon: IconHelper.getIcon('youtube', 'platforms')
      },
      {
        canShow: () => true,
        label: `View ${this.channelName} Channel`,
        iconAlt: 'YouTube icon',
        action: this.openChannel.bind(this),
        icon: IconHelper.getIcon('youtube', 'platforms')
      },
      ...options
    ]
  }
}