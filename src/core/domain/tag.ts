import type { TTag } from "../schemas/tag/tag.schema";
import type { Entry } from "./entry";

import { EEntryType, hasEpisodes } from "../enums/entry-type.enum";
import { shortest } from "../utils/array";
import { formatDuration, formatTimestamp } from "../utils/time";
import { readYouTubeContext } from "./context";



/**
 * @description
 * The default hover text of a reaction: the episode and what it is from,
 * or just its name when it has no episode.
 *
 * @param entry - What the reaction is about, if known
 * @param label - The reaction's label, e.g. the episode number
 * @returns e.g. "Episode 7 of FROM", or "FROM"
 */
export function describeReaction(entry: Entry | null, label: string): string {
  const title = entry?.title ?? label;

  return hasEpisodes(entry?.type) && label ? `Episode ${label} of ${title}` : title;
}

/**
 * @description
 * A reaction inside a post: what KOL reacted to and when, in seconds.
 */
export class Tag {
  /**
   * @description
   * The unique identifier for the tag
   */
  readonly id: string;

  /**
   * @description
   * The ID of the entry the tag is about
   */
  readonly entryId: string;

  /**
   * @description
   * The entry the tag is about, or null if it is not in the database
   */
  readonly entry: Entry | null;

  /**
   * @description
   * Extra data about the reaction, depending on the entry type
   */
  readonly context: Record<string, unknown>;

  /**
   * @description
   * The label of the tag, e.g. the episode number
   */
  readonly label: string;

  /**
   * @description
   * The description of the tag
   */
  readonly description: string;

  /**
   * @description
   * When the reaction starts in the video, in seconds
   */
  readonly startTime: number;

  /**
   * @description
   * When the reaction ends in the video, in seconds
   */
  readonly endTime: number;

  /**
   * @description
   * Creates a new Tag instance.
   *
   * @param model - The tag's data
   * @param entry - The entry the tag is about, if known
   */
  constructor(model: TTag, entry: Entry | null) {
    this.id = model.id;
    this.entry = entry;
    this.label = model.label;
    this.entryId = model.entryId;
    this.context = model.context;
    this.endTime = model.endTime;
    this.startTime = model.startTime;
    this.description = model.description;
  }

  /**
   * @description
   * The title of what the reaction is about
   *
   * @returns The entry's title, or the tag's label if the entry is unknown
   */
  getTitle(): string {
    return this.entry?.title ?? this.label;
  }

  /**
   * @description
   * Gets a shortened version of the title for the tag's entry
   *
   * @returns A string representing the entry's title and the tag's label
   */
  getShortTitle(): string {
    if (this.entry && hasEpisodes(this.entry.type)) {
      return `${this.entry.shortTitle} - ${this.label}`;
    }

    switch (this.entry?.type) {
      case EEntryType.YOUTUBE: return shortest(readYouTubeContext(this.context).altTitles ?? [], this.label);

      default: return this.label;
    }
  }

  /**
   * @description
   * The text shown when hovering the reaction
   *
   * @returns The tag's description, or a default one when it has none
   */
  getHoverText(): string {
    return this.description.trim() || describeReaction(this.entry, this.label.trim());
  }

  /**
   * @description
   * Gets a detailed description of the tag
   *
   * @returns A string describing the tag and the episode it corresponds to
   */
  getDetailDescription(): string {
    return hasEpisodes(this.entry?.type) ? `Episode ${this.label}` : this.label;
  }

  /**
   * @description
   * Returns a human readable reaction starting time
   *
   * @returns The formatted start time string
   */
  getReadableStartTime(): string {
    return formatTimestamp(this.startTime);
  }

  /**
   * @description
   * Returns a human readable reaction duration
   *
   * @returns The formatted duration string
   */
  getReadableDuration(): string {
    return formatDuration(this.endTime - this.startTime);
  }
}
