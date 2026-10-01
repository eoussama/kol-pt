import type { Entry } from "../../../domain/entry";
import type { TEntry } from "../../../schemas/entry/entry.schema";

import { createEntry } from "../../../domain/hydrate";
import { EntryListSchema } from "../../../schemas/entry/entry.schema";
import { RepositoryHelper } from "./repository.helper";



/**
 * @description
 * Helps with managing entries
 */
export class EntriesHelper {
  /**
   * @description
   * The name of the key that stores the entries
   * on the realtime database
   */
  private static readonly DB_KEY = "entries";

  /**
   * @description
   * Returns the validated data of all entries
   *
   * @param cache - Whether to use cache when needed
   * @returns Promise resolving to the entries' data
   */
  static async loadData(cache: boolean = true): Promise<Array<TEntry>> {
    return EntryListSchema.parse(await RepositoryHelper.get<unknown>(this.DB_KEY, cache));
  }

  /**
   * @description
   * Returns the list of all entries
   *
   * @param cache - Whether to use cache when needed
   * @returns Promise resolving to an array of Entry instances
   */
  static async load(cache: boolean = true): Promise<Array<Entry>> {
    return (await this.loadData(cache)).map(createEntry);
  }

  /**
   * @description
   * Returns a specific entry, refreshing the cache once if it is missing
   *
   * @param id - The ID of the entry
   * @param cache - Whether to use cache when needed
   * @returns Promise resolving to the matching Entry or undefined
   */
  static async get(id: string, cache: boolean = true): Promise<Entry | undefined> {
    const found = (await this.load(cache)).find(entry => entry.id === id);

    if (!found && cache) {
      return (await this.load(false)).find(entry => entry.id === id);
    }

    return found;
  }
}
