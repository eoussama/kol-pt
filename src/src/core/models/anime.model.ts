import { Entry } from "./entry.model";
import { IOption } from "../types/option.type";
import { EntryType } from "../enums/entry-type.enum";
import { IAnimeEntry } from "../types/entry/anime-entry.type";
import { IconHelper } from "../helpers/asset/icon.helper";
import { IAnimeContext } from "../types/tag/anime-context.type";



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
   * @description
   *The ID of the Zoro.to page.
   */
  zoroId: string;

  /**
   * @constructor
   * @param model The anime entry model. 
   */
  constructor(model?: IAnimeEntry) {
    super(model);

    this.type = EntryType.Anime;
    this.malId = model?.malId ?? -1;
    this.zoroId = model?.zoroId ?? '';
    this.kitsuId = model?.kitsuId ?? '';
    this.anilistId = model?.anilistId ?? -1;
  }

  /**
   * @description
   * Opens the MyAnimeList page of the anime in a new tab.
   */
  viewMAL(): void {
    window.open(`https://myanimelist.net/anime/${this.malId}`, '_blank');
  }

  /**
   * @description
   * Opens the AniList page of the anime in a new tab.
   */
  viewAniList(): void {
    window.open(`https://anilist.co/anime/${this.anilistId}`, '_blank');
  }

  /**
   * @description
   * Opens the Kitsu page of the anime in a new tab.
   */
  viewKitsu(): void {
    window.open(`https://kitsu.io/anime/${this.kitsuId}`, '_blank');
  }

  /**
   * @description
   * Opens the Zoro.to page of the anime in a new tab.
   */
  viewZoro(): void {
    window.open(`https://zoro.to/watch/${this.zoroId}`, '_blank');
  }

  /**
   * @description
   * Opens the Zoro.to page of the anime in a new tab.
   *
   * @param episodeId The ID of the episode
   */
  watchZoro(episodeId: number): void {
    window.open(`https://zoro.to/watch/${this.zoroId}?ep=${episodeId}`, '_blank');
  }

  /**
 * @description
 * Gets the list of menu options
 *
 * @param context The parent tag's context, passed for extra context
 */
  getOptions(context: IAnimeContext): Array<IOption> {
    const options = super.getOptions(context);

    return [
      {
        divider: true,
        label: 'Watch on Zoro',
        iconAlt: 'Zoro.to icon',
        canShow: () => Boolean(context.zoroId),
        icon: IconHelper.getIcon('zoro', 'platforms'),
        action: () => this.watchZoro.call(this, context.zoroId ?? -1)
      },
      {
        iconAlt: 'MAL icon',
        label: 'View on MyAnimeList',
        action: this.viewMAL.bind(this),
        canShow: () => Boolean(this.malId),
        icon: IconHelper.getIcon('mal', 'platforms')
      },
      {
        iconAlt: 'AniList icon',
        label: 'View on AniList',
        action: this.viewAniList.bind(this),
        canShow: () => Boolean(this.anilistId),
        icon: IconHelper.getIcon('anilist', 'platforms')
      },
      {
        iconAlt: 'Kitsu icon',
        label: 'View on Kitsu',
        action: this.viewKitsu.bind(this),
        canShow: () => (this.kitsuId?.length ?? 0) > 0,
        icon: IconHelper.getIcon('kitsu', 'platforms')
      },
      ...options
    ]
  }
}