import { FirebaseHelper } from './firebase.helper';
import { ISettings } from '../../types/settings.type';



/**
 * @description
 * Helps with user settings
 */
export class SettingsHelper {

  /**
   * @description
   * Fetches settings for a specific user
   *
   * @param userId The ID of the target user
   */
  static get(userId: string): Promise<ISettings> {
    return FirebaseHelper.get(`users/${userId}` as any, false);
  }

  /**
   * @description
   * Updates settings for a specific user
   *
   * @param userId The ID of the target user
   * @param key The settings key to update
   * @param value The value to update
   */
  static set<T = any>(userId: string, key: keyof ISettings, value: T): Promise<void> {
    return FirebaseHelper.set(`users/${userId}/${key}`, value);
  }
}