import { FirebaseHelper } from './firebase.helper';
import { ISettings } from '../../types/settings.type';
import { ViewMode } from '../../enums/view-mode.enum';



/**
 * @description
 * Helps with user watch lists, a list
 * that contains info about the watched
 * reactions by the user.
 */
export class WatchHelper {

  private static readonly DB_KEY: string = 'watchlist'

  /**
   * @description
   * Fetches the watchlist for a specific user
   *
   * @param userId The ID of the target user
   */
  static get(userId: string): Promise<Array<string>> {
    return FirebaseHelper.get(`users/${userId}/${this.DB_KEY}` as any, false);
  }

  /**
   * @description
   * Updates the watchlist for a specific user
   *
   * @param userId The ID of the target user
   * @param reactionId The ID of the reaction to add
   */
  static async add<T = any>(userId: string, reactionId: string): Promise<void> {
    const watchlist = await this.get(userId);
    const newWatchlist = watchlist.push(reactionId);

    return FirebaseHelper.set(`users/${userId}/${this.DB_KEY}`, newWatchlist);
  }

  // TODO: add dynamic user data helper that other helpers can inherit
}