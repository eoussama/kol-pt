import { IEntry } from "./entry.type";



/**
 * @description
 * Represents an anime entry that extends `IEntry`.
 */
export interface IAnimeEntry extends IEntry {

  /**
   * @description
   * The ID of the anime in MyAnimeList.
   */
  malId: number;

  /**
   * @description
   * The ID of the anime in AniList.
   */
  anilistId: number;

  /**
   * @description
   * The ID of the anime in Kitsu.
   */
  kitsuId: string;
}
