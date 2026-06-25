import { RepositoryHelper } from "./repository.helper";



/**
 * @description
 * Helps with user watch lists, a list
 * that contains info about the watched
 * reactions by the user.
 */
export class WatchHelper {
  /**
   * @description
   * The name of the key that stors the watchlist
   * on the realtime database for the user
   */
  private static readonly DB_KEY: string = "watchlist";

  /**
   * @description
   * Fetches the watchlist for a specific user
   *
   * @param userId - The ID of the target user
   * @returns Promise resolving to the user's watchlist
   */
  static async get(userId: string): Promise<Array<string>> {
    const watchlist = await RepositoryHelper.get<Array<string>>(`users/${userId}/${this.DB_KEY}`, false);

    if (!watchlist) {
      const newWatchlist: Array<string> = [];

      await this.set(userId, newWatchlist);

      return newWatchlist;
    }

    return watchlist;
  }

  /**
   * @description
   * Updates the watchlist for a specific user
   *
   * @param userId - The ID of the target user
   * @param reactions - The array of reaction IDs
   * @returns Promise that resolves when the watchlist is updated
   */
  static set(userId: string, reactions: Array<string>): Promise<void> {
    return RepositoryHelper.set(`users/${userId}/${this.DB_KEY}`, reactions);
  }
}
