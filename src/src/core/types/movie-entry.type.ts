import { IEntry } from "./entry.type";



/**
 * @description
 * Interface representing a movie entry which extends IEntry.
 * 
 * @property {string} rottentomatoesId - The id of the movie in Rotten Tomatoes.
 * @extends IEntry
 */
export interface IMovieEntry extends IEntry {

  /**
   * @description
   * representing the ID of the movie in Rotten Tomatoes database.
   * It is an optional property, but if defined, it must be a non-empty string.
   */
  rottentomatoesId: string;
}