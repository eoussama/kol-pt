import { EntryType } from "../enums/entry-type.enum";



/**
 * @description
 * Interface for a generic entry
 */
export interface IEntry {

  /**
   * @description
   * Unique identifier for the entry
   */
  id: string;

  /**
   * @description
   * IMDb identifier for the entry
   */
  imdbId?: string;

  /**
   * @description
   * Short title for the entry
   */
  shortTitle?: string;

  /**
   * @description
   * Alternative titles for the entry
   */
  altTitles?: Array<string>;

  /**
   * @description
   * Title of the entry
   */
  title: string;

  /**
   * @description
   * Type of the entry
   */
  type: EntryType;
}