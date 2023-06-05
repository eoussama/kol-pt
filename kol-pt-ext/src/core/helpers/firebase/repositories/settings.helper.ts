import { RepositoryHelper } from './repository.helper';
import { ISettings } from '../../../types/settings.type';
import { ViewMode } from '../../../enums/view-mode.enum';



/**
 * @description
 * Helps with user settings
 */
export class SettingsHelper {

  /**
   * @description
   * The name of the key that stors the settings
   * on the realtime database for the user
   */
  private static readonly DB_KEY: string = 'settings';

  /**
   * @description
   * Fetches a setting for a specific user
   *
   * @param userId The ID of the target user
   * @param key The settings key to get
   */
  static get<T extends keyof ISettings>(userId: string, key: T): Promise<ISettings[T]> {
    return new Promise(async resolve => {
      const settings = await this.load(userId);

      // If users has no settings saved, initialize new ones
      if (!settings) {
        const newSettings = this.init();
        this.update(userId, newSettings);
        return resolve(newSettings[key]);
      }

      resolve(settings[key]);
    });
  }

  /**
   * @description
   * Updates a setting for a specific user
   *
   * @param userId The ID of the target user
   * @param key The settings key to update
   * @param value The value to update
   */
  static set<T = any>(userId: string, key: keyof ISettings, value: T): Promise<void> {
    return RepositoryHelper.set(`users/${userId}/${this.DB_KEY}/${key}` as any, value);
  }

  /**
   * @description
   * Fetches all settings for a specific user
   *
   * @param userId The ID of the target user
   */
  static load(userId: string): Promise<ISettings> {
    return RepositoryHelper.get(`users/${userId}/${this.DB_KEY}` as any, false);
  }

  /**
   * @description
   * Updates all settings for a specific user
   *
   * @param userId The ID of the target user
   * @param settings The new settings
   */
  static update(userId: string, settings: ISettings): Promise<void> {
    return RepositoryHelper.set(`users/${userId}/${this.DB_KEY}` as any, settings);
  }

  /**
   * @description
   * Initializes a new settings object
   */
  private static init(): ISettings {
    return {
      viewMode: ViewMode.Expanded
    };
  }
}