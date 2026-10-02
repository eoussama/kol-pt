import type { TAnimeEntry } from "../schemas/entry/anime-entry.schema";
import type { IOption } from "../types/option.type";

import { getImageUrl } from "../utils/assets";
import { openAniList, openKitsu, openMAL } from "../utils/links";
import { Entry } from "./entry";



/**
 * @description
 * Represents an Anime Entry which extends the base class
 */
export class Anime extends Entry {
  /**
   * @description
   * The MyAnimeList ID of the anime, -1 if unknown.
   */
  readonly malId: number;

  /**
   * @description
   * The AniList ID of the anime, -1 if unknown.
   */
  readonly anilistId: number;

  /**
   * @description
   * The Kitsu ID of the anime, empty if unknown.
   */
  readonly kitsuId: string;

  /**
   * @description
   * Creates a new Anime instance.
   *
   * @param model - The anime entry's data
   */
  constructor(model: TAnimeEntry) {
    super(model);

    this.malId = model.malId ?? -1;
    this.anilistId = model.anilistId ?? -1;
    this.kitsuId = model.kitsuId ?? "";
  }

  /**
   * @description
   * Gets the list of menu options
   *
   * @param context - The parent tag's context, passed for extra context
   * @returns Array of menu option objects
   */
  override getOptions(context?: Record<string, unknown>): Array<IOption> {
    return [
      {
        iconAlt: "MAL icon",
        label: "View on MyAnimeList",
        action: () => openMAL(this.malId),
        canShow: () => this.malId > 0,
        icon: getImageUrl("mal", "platforms"),
      },
      {
        iconAlt: "AniList icon",
        label: "View on AniList",
        action: () => openAniList(this.anilistId),
        canShow: () => this.anilistId > 0,
        icon: getImageUrl("anilist", "platforms"),
      },
      {
        iconAlt: "Kitsu icon",
        label: "View on Kitsu",
        action: () => openKitsu(this.kitsuId),
        canShow: () => this.kitsuId.length > 0,
        icon: getImageUrl("kitsu", "platforms"),
      },
      ...super.getOptions(context),
    ];
  }
}
