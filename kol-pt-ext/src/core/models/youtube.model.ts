import type { IYouTubeEntry } from "../types/entry/youtube-entry.type";
import type { IOption } from "../types/option.type";
import type { IYouTubeContext } from "../types/tag/youtube-context.type";
import { EntryType } from "../enums/entry-type.enum";
import { IconHelper } from "../helpers/asset/icon.helper";
import { NavigationHelper } from "../helpers/navigator/navigation.helper";
import { Entry } from "./entry.model";



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
   * @description
   * Creates a new YouTube instance.
   *
   * @param model - The youtube entry model
   */
  constructor(model?: IYouTubeEntry) {
    super(model);

    this.type = EntryType.YouTube;
    this.handle = model?.handle ?? "";
    this.channelId = model?.channelId ?? "";
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
   * @param context - The parent tag's context, passed for extra context
   * @returns Array of menu option objects
   */
  getOptions(context?: IYouTubeContext): Array<IOption> {
    const options = super.getOptions();

    return [
      {
        divider: true,
        iconAlt: "YouTube icon",
        label: "Watch on YouTube",
        canShow: () => Boolean(context?.videoId),
        icon: IconHelper.getIcon("youtube", "platforms"),
        action: () => this.watchVideo(context?.videoId ?? ""),
      },
      {
        canShow: () => true,
        iconAlt: "YouTube icon",
        label: `View ${this.title} Channel`,
        action: this.openChannel.bind(this),
        icon: IconHelper.getIcon("youtube", "platforms"),
      },
      ...options,
    ];
  }
}
