import { Entry } from './entry.model';
import { IOption } from '../types/option.type';
import { EntryType } from '../enums/entry-type.enum';
import { IconHelper } from '../helpers/asset/icon.helper';
import { IYouTubeEntry } from '../types/entry/youtube-entry.type';
import { IYouTubeContext } from '../types/tag/youtube-context.type';
import { NavigationHelper } from '../helpers/navigator/navigation.helper';



/**
 * @description
 * Represents a YouTube Entry which extends the base class 
 */
export class YouTube extends Entry {

  /**
   * @description
   * The YouTube channel ID.
   */
  channelId: string;

  /**
   * @description
   * The YouTube channel handle.
   */
  handle: string;

  /**
   * @constructor
   * @param model The youtube entry model. 
   */
  constructor(model?: IYouTubeEntry) {
    super(model);

    this.type = EntryType.YouTube;
    this.handle = model?.handle ?? '';
    this.channelId = model?.channelId ?? '';
  }

  /**
   * @description
   * Opens the YouTube video.
   *
   * @param videoId The ID of the YouTube video to watch.
   */
  watchVideo(videoId: string): void {
    NavigationHelper.openYoutubeVideo(videoId);
  }

  /**
   * @description
   * Opens the YouTube video.
   */
  openChannel(): void {
    NavigationHelper.openYoutubeChannel(this.handle);
  }

  /**
 * @description
 * Gets the list of menu options
 *
 * @param context The parent tag's context, passed for extra context
 */
  getOptions(context?: IYouTubeContext): Array<IOption> {
    const options = super.getOptions();

    return [
      {
        divider: true,
        iconAlt: 'YouTube icon',
        label: 'Watch on YouTube',
        canShow: () => Boolean(context?.videoId),
        icon: IconHelper.getIcon('youtube', 'platforms'),
        action: () => this.watchVideo.call(this, context?.videoId ?? '')
      },
      {
        canShow: () => true,
        iconAlt: 'YouTube icon',
        label: `View ${this.title} Channel`,
        action: this.openChannel.bind(this),
        icon: IconHelper.getIcon('youtube', 'platforms')
      },
      ...options
    ]
  }
}