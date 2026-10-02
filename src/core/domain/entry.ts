import type { TEntryType } from "../enums/entry-type.enum";
import type { TEntry } from "../schemas/entry/entry.schema";
import type { IOption } from "../types/option.type";
import type { ISearch } from "./search";

import { EEntryType } from "../enums/entry-type.enum";
import { shortest } from "../utils/array";
import { getImageUrl } from "../utils/assets";
import { openIMDb } from "../utils/links";



const ENTRY_TYPE_NAMES: Record<TEntryType, string> = {
  [EEntryType.ANIME]: "Anime",
  [EEntryType.MOVIE]: "Movie",
  [EEntryType.CARTOON]: "Cartoon",
  [EEntryType.YOUTUBE]: "YouTube",
  [EEntryType.TV_SHOW]: "TV Show",
};

/**
 * @description
 * Represents a media entry, such as a movie, anime, cartoon or YouTube channel.
 */
export class Entry implements ISearch {
  /**
   * @description
   * The entry's data, as stored, for editing.
   */
  readonly model: TEntry;

  /**
   * @description
   * The unique ID of the entry.
   */
  readonly id: string;

  /**
   * @description
   * The ID of the entry on IMDb, if available.
   */
  readonly imdbId: string;

  /**
   * @description
   * The link to the entry's cover image, or an empty string. Entries without
   * a cover of their own use the one MyAnimeList or YouTube provide.
   */
  readonly cover: string;

  /**
   * @description
   * The title of the entry.
   */
  readonly title: string;

  /**
   * @description
   * A shortened version of the entry's title.
   */
  readonly shortTitle: string;

  /**
   * @description
   * An array of alternative titles for the entry.
   */
  readonly altTitles: ReadonlyArray<string>;

  /**
   * @description
   * The type of the entry (Anime, Movie, TV Show, Cartoon, YouTube).
   */
  readonly type: TEntryType;

  /**
   * @description
   * Creates a new Entry instance.
   *
   * @param model - The entry's data
   */
  constructor(model: TEntry) {
    this.model = model;
    this.id = model.id;
    this.type = model.type;
    this.title = model.title;
    this.imdbId = model.imdbId ?? "";
    this.cover = model.cover ?? "";
    this.altTitles = model.altTitles ?? [];
    this.shortTitle = shortest(this.altTitles, this.title);
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
   * @description
   * Gets the list of menu options
   *
   * @param _context - The parent tag's context, passed for extra context
   * @returns Array of menu option objects
   */
  getOptions(_context?: Record<string, unknown>): Array<IOption> {
    return [
      {
        iconAlt: "IMDb icon",
        label: "View on IMDb",
        action: () => openIMDb(this.imdbId),
        canShow: () => this.imdbId.length > 0,
        icon: getImageUrl("imdb", "platforms"),
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
    const searchTarget = [this.title, this.imdbId, this.getTypeName(), ...this.altTitles]
      .join(" ")
      .toLowerCase();

    return searchTarget.includes(query);
  }
}
