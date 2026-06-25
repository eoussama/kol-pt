import type { TEntryType } from "../enums/entry-type.enum";
import type { IEntry } from "../types/entry/entry.type";
import type { IOption } from "../types/option.type";
import type { ISearch } from "../types/search.type";
import type { IEntryContext } from "../types/tag/entry-context.type";
import type { Post } from "./post.model";
import { EEntryType } from "../enums/entry-type.enum";
import { IconHelper } from "../helpers/asset/icon.helper";
import { NavigationHelper } from "../helpers/navigator/navigation.helper";
import { ArrayHelper } from "../helpers/parse/array.helper";



const ENTRY_TYPE_NAMES: Record<TEntryType, string> = {
  [EEntryType.ANIME]: "Anime",
  [EEntryType.MOVIE]: "Movie",
  [EEntryType.CARTOON]: "Cartoon",
  [EEntryType.YOUTUBE]: "YouTube",
};

/**
 * @description
 * Represents a media entry, such as a movie, anime, cartoon or YouTube video.
 */
export class Entry implements ISearch {
  /**
   * @description
   * The unique ID of the entry.
   */
  id: string;

  /**
   * @description
   * The ID of the entry on IMDb, if available.
   */
  imdbId?: string;

  /**
   * @description
   * The title of the entry.
   */
  title: string;

  /**
   * @description
   * A shortened version of the entry's title.
   */
  shortTitle: string;

  /**
   * @description
   * An array of alternative titles for the entry.
   */
  altTitles: Array<string>;

  /**
   * @description
   * The type of the entry (Anime, Movie, Cartoon, YouTube).
   */
  type: TEntryType;

  /**
   * @description
   * The list of all posts that include the entry
   */
  reactions: Array<Post>;

  /**
   * @description
   * Creates a new Entry instance.
   *
   * @param model - An optional object containing the initial values for the Entry
   */
  constructor(model?: IEntry) {
    this.id = model?.id ?? "";
    this.title = model?.title ?? "";
    this.imdbId = model?.imdbId ?? "";
    this.type = model?.type ?? EEntryType.ANIME;
    this.altTitles = model?.altTitles ?? [this.title];
    this.shortTitle = ArrayHelper.getShortest(this.altTitles, this.title);

    if (model && "reactions" in model) {
      this.reactions = (model?.reactions as Array<Post>) ?? [];
    }
    else {
      this.reactions = [];
    }
  }

  /**
   * @description
   * Opens the IMDb page for the entry in a new window.
   */
  openIMDb(): void {
    NavigationHelper.openIMDb(this.imdbId ?? "");
  }

  /**
   * @description
   * Returns the type as a readable name
   *
   * @returns The human-readable type name
   */
  getTypeName(): string {
    return ENTRY_TYPE_NAMES[this.type] ?? "";
  }

  /**
   * @override
   * @description
   * Gets the list of menu options
   *
   * @param _context - The parent tag's context, passed for extra context
   * @returns Array of menu option objects
   */
  getOptions(_context?: IEntryContext): Array<IOption> {
    return [
      {
        iconAlt: "IMDb icon",
        label: "View on IMDb",
        action: this.openIMDb.bind(this),
        canShow: () => (this.imdbId?.length ?? 0) > 0,
        icon: IconHelper.getIcon("imdb", "platforms"),
      },
    ];
  }

  /**
   * @description
   * Checks if model matches search query
   *
   * @param search - The search query
   * @returns True if the model matches the search query
   */
  match(search: string): boolean {
    const query = search.toLowerCase();
    const searchTarget = this.title
      .concat(this.title)
      .concat(this.shortTitle)
      .concat(this.imdbId ?? "")
      .concat(this.getTypeName())
      .concat(this.altTitles.join())
      .toLowerCase();

    return searchTarget.includes(query);
  }
}
