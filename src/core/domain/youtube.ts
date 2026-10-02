import type { TYouTubeEntry } from "../schemas/entry/youtube-entry.schema";
import type { IOption } from "../types/option.type";

import { getImageUrl } from "../utils/assets";
import { openYouTubeChannel, openYouTubeVideo } from "../utils/links";
import { readYouTubeContext } from "./context";
import { Entry } from "./entry";



/**
 * @description
 * Represents a YouTube channel Entry which extends the base class
 */
export class YouTube extends Entry {
  /**
   * @description
   * The YouTube channel ID.
   */
  readonly channelId: string;

  /**
   * @description
   * The YouTube channel handle, without the @.
   */
  readonly handle: string;

  /**
   * @description
   * Creates a new YouTube instance.
   *
   * @param model - The YouTube entry's data
   */
  constructor(model: TYouTubeEntry) {
    super(model);

    this.handle = model.handle ?? "";
    this.channelId = model.channelId ?? "";
  }

  /**
   * @description
   * Gets the list of menu options
   *
   * @param context - The parent tag's context, which may name the video
   * @returns Array of menu option objects
   */
  override getOptions(context?: Record<string, unknown>): Array<IOption> {
    const { videoId } = readYouTubeContext(context);

    return [
      {
        divider: true,
        iconAlt: "YouTube icon",
        label: "Watch on YouTube",
        canShow: () => Boolean(videoId),
        icon: getImageUrl("youtube", "platforms"),
        action: () => openYouTubeVideo(videoId ?? ""),
      },
      {
        canShow: () => this.handle.length > 0,
        iconAlt: "YouTube icon",
        label: `View ${this.title} Channel`,
        action: () => openYouTubeChannel(this.handle),
        icon: getImageUrl("youtube", "platforms"),
      },
      ...super.getOptions(context),
    ];
  }
}
