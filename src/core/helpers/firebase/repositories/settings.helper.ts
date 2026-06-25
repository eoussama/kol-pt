import type { ISettings } from "../../../types/settings.type";
import { EViewMode } from "../../../enums/view-mode.enum";
import { RepositoryHelper } from "./repository.helper";



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
  private static readonly DB_KEY: string = "settings";

  /**
   * @description
   * Fetches a setting for a specific user
   *
   * @param userId - The ID of the target user
   * @param key - The settings key to get
   * @returns Promise resolving to the setting value
   */
  static async get<T extends keyof ISettings>(userId: string, key: T): Promise<ISettings[T]> {
    const settings = await this.load(userId);

    if (!settings) {
      const newSettings = this.init();

      this.update(userId, newSettings);

      return newSettings[key];
    }

    return settings[key];
  }

  /**
   * @description
   * Updates a setting for a specific user
   *
   * @param userId - The ID of the target user
   * @param key - The settings key to update
   * @param value - The value to update
   * @returns Promise that resolves when the setting is updated
   */
  static set<T extends ISettings[keyof ISettings]>(userId: string, key: keyof ISettings, value: T): Promise<void> {
    return RepositoryHelper.set(`users/${userId}/${this.DB_KEY}/${String(key)}`, value);
  }

  /**
   * @description
   * Fetches all settings for a specific user
   *
   * @param userId - The ID of the target user
   * @returns Promise resolving to the user's settings
   */
  static load(userId: string): Promise<ISettings> {
    return RepositoryHelper.get<ISettings>(`users/${userId}/${this.DB_KEY}`, false);
  }

  /**
   * @description
   * Updates all settings for a specific user
   *
   * @param userId - The ID of the target user
   * @param settings - The new settings
   * @returns Promise that resolves when settings are updated
   */
  static update(userId: string, settings: ISettings): Promise<void> {
    return RepositoryHelper.set(`users/${userId}/${this.DB_KEY}`, settings);
  }

  /**
   * @description
   * Initializes a new settings object
   *
   * @returns A default settings object
   */
  private static init(): ISettings {
    return {
      viewMode: EViewMode.EXPANDED,
    };
  }
}
