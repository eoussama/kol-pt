import { IOption } from "../types/option.type";
import { IEntry } from "../types/entry/entry.type";
import { EntryType } from "../enums/entry-type.enum";
import { IconHelper } from "../helpers/asset/icon.helper";
import { IEntryContext } from "../types/tag/entry-context.type";



/**
 * @description
 * Represents a media entry, such as a movie, anime, cartoon or YouTube video.
 */
export class Entry {

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
  type: EntryType;

  /**
   * @constructor
   * @param model An optional object containing the initial values for the Entry.
   */
  constructor(model?: IEntry) {
    this.id = model?.id ?? '';
    this.title = model?.title ?? '';
    this.imdbId = model?.imdbId ?? '';
    this.type = model?.type ?? EntryType.Anime;
    this.shortTitle = model?.shortTitle ?? this.title ?? '';
    this.altTitles = model?.altTitles ?? [this.shortTitle ?? ''];
  }

  /**
   * @description
   * Opens the IMDb page for the entry in a new window.
   */
  openIMDb(): void {
    window.open(`https://www.imdb.com/title/${this.imdbId}`, '_blank');
  }

  /**
   * @override
   * @description
   * Gets the list of menu options
   *
   * @param context The parent tag's context, passed for extra context
   */
  getOptions(context: IEntryContext): Array<IOption> {
    return [
      {
        iconAlt: 'IMDb icon',
        label: 'View on IMDb',
        action: this.openIMDb.bind(this),
        canShow: () => (this.imdbId?.length ?? 0) > 0,
        icon: IconHelper.getIcon('imdb', 'platforms')
      }
    ]
  }
}