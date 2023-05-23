import { Entry } from "../../models/entry.model";



/**
 * @description
 * Interface representing the shape of the state object for entries.
 */
export interface IEntriesState {

  /**
   * @description
   * Flag indicating if entries are currently being loaded.
   */
  loading: boolean;

  /**
   * @description
   * Flag indicating if entries were not able to be loaded.
   */
  error: boolean;

  /**
   * @description
   * Array of Entry objects representing the entries that have been loaded.
   */
  entries: Array<Entry>;

  /**
   * @description
   * Function to load entries. If `cache` is true, attempts to load entries from cache.
   * Otherwise, loads entries from API.
   * 
   * @param cache - Optional flag indicating whether to load entries from cache or API.
   * Default is false.
   */
  loadEntries: (cache?: boolean) => void;
}