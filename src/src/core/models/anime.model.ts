import { Entry } from "./entry.model";
import { IOption } from "../types/option.type";
import { EntryType } from "../enums/entry-type.enum";
import { IAnimeEntry } from "../types/anime-entry.type";
import { IconHelper } from "../helpers/asset/icon.helper";



/**
 * @description
 * Represents an Anime Entry which extends the base class 
 */
export class Anime extends Entry {

  /**
   * @description
   * The MyAnimeList ID of the anime.
   */
  malId: number;

  /**
   * @description
   * The AniList ID of the anime.
   */
  anilistId: number;

  /**
   * @description
   * The Kitsu ID of the anime.
   */
  kitsuId: string;

  /**
   * @constructor
   * @param model The anime entry model. 
   */
  constructor(model?: IAnimeEntry) {
    super(model);

    this.type = EntryType.Anime;
    this.malId = model?.malId ?? -1;
    this.kitsuId = model?.kitsuId ?? '';
    this.anilistId = model?.anilistId ?? -1;
  }

  /**
   * @description
   * Opens the MyAnimeList page of the anime in a new tab.
   */
  openMAL(): void {
    window.open(`https://myanimelist.net/anime/${this.malId}`, '_blank');
  }

  /**
   * @description
   * Opens the AniList page of the anime in a new tab.
   */
  openAniList(): void {
    window.open(`https://anilist.co/anime/${this.anilistId}`, '_blank');
  }

  /**
   * @description
   * Opens the Kitsu page of the anime in a new tab.
   */
  openKitsu(): void {
    window.open(`https://kitsu.io/anime/${this.kitsuId}`, '_blank');
  }

  /**
 * @description
 * Gets the list of menu options
 */
  getOptions(): Array<IOption> {
    const options = super.getOptions();

    return [
      {
        iconAlt: 'MAL icon',
        label: 'View on MyAnimeList',
        action: this.openMAL.bind(this),
        icon: IconHelper.getIcon('mal', 'platforms')
      },
      {
        iconAlt: 'AniList icon',
        label: 'View on AniList',
        action: this.openAniList.bind(this),
        icon: IconHelper.getIcon('anilist', 'platforms')
      },
      {
        iconAlt: 'Kitsu icon',
        label: 'View on Kitsu',
        action: this.openKitsu.bind(this),
        icon: IconHelper.getIcon('kitsu', 'platforms')
      },
      ...options
    ]
  }
}