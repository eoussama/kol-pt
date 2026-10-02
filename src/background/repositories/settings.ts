import type { TSettings } from "../../core/schemas/settings.schema";

import { EViewMode } from "../../core/enums/view-mode.enum";
import { SettingsSchema } from "../../core/schemas/settings.schema";
import { readValue, updateValues } from "../database";



/**
 * @description
 * Settings for users who never changed them.
 */
export const DEFAULT_SETTINGS: TSettings = {
  viewMode: EViewMode.EXPANDED,
};

/**
 * @description
 * Returns a user's settings, with defaults for anything unset or invalid.
 *
 * @param uid - The user's ID
 * @returns Promise resolving to the settings
 */
export async function getSettings(uid: string): Promise<TSettings> {
  const parsed = SettingsSchema.partial().safeParse(await readValue(`users/${uid}/settings`) ?? {});

  return { ...DEFAULT_SETTINGS, ...(parsed.success ? parsed.data : {}) };
}

/**
 * @description
 * Updates some of a user's settings.
 *
 * @param uid - The user's ID
 * @param settings - The settings to change
 * @returns Promise resolving to the updated settings
 */
export async function updateSettings(uid: string, settings: Partial<TSettings>): Promise<TSettings> {
  await updateValues(`users/${uid}/settings`, settings);

  return getSettings(uid);
}
