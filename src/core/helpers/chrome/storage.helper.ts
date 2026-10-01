import { browser } from "wxt/browser";
import { Base64Helper } from "../parse/base64.helper";



/**
 * @description
 * Helps with extension storage
 */
export class StorageHelper {
  /**
   * @description
   * Fetches a value from local storage
   *
   * @param key - The key to get
   * @returns Promise resolving to the stored string value
   */
  static async get(key: string): Promise<string> {
    const data = await browser.storage.local.get(key);
    const value = (data[key] ?? "") as string;

    return Base64Helper.decrypt(value);
  }

  /**
   * @description
   * Updates/adds a value to local storage
   *
   * @param key - The key to set
   * @param value - The value to set
   * @returns Promise that resolves when the value is stored
   */
  static async set(key: string, value: string): Promise<void> {
    await browser.storage.local.set({ [key]: Base64Helper.encrypt(value) });
  }

  /**
   * @description
   * Removes a key from the storage
   *
   * @param key - The key to remove
   * @returns Promise that resolves when the key is removed
   */
  static async clear(key: string): Promise<void> {
    await browser.storage.local.remove(key);
  }
}
