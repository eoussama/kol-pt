import { RepositoryHelper } from './repository.helper';



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
  private static readonly DB_KEY: string = 'watchlist';

  /**
   * @description
   * Fetches the watchlist for a specific user
   *
   * @param userId The ID of the target user
   */
  static get(userId: string): Promise<Array<string>> {
    return new Promise(async resolve => {
      const watchlist = await RepositoryHelper.get(`users/${userId}/${this.DB_KEY}` as any, false);

      // If users has no watchlist saved, initialize new ones
      if (!watchlist) {
        const newWatchlist: Array<string> = [];
        this.set(userId, newWatchlist);
        return resolve(newWatchlist);
      }

      return RepositoryHelper.get(`users/${userId}/${this.DB_KEY}` as any, false);
    });
  }

  /**
   * @description
   * Updates the watchlist for a specific user
   *
   * @param userId The ID of the target user
   * @param reactions The array of reaction IDs
   */
  static async set<T = any>(userId: string, reactions: Array<string>): Promise<void> {
    return RepositoryHelper.set(`users/${userId}/${this.DB_KEY}` as any, reactions);
  }
}