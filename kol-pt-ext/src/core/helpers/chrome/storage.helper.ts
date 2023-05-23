import { Base64Helper } from "../parse/base64.helper";



/**
 * @description
 * Helps with chrome storage
 */
export class StorageHelper {

  /**
   * @description
   * Fetches a value from local storage
   *
   * @param key The key to get
   */
  static get(key: string): Promise<string> {
    return new Promise(async resolve => {
      if (chrome?.storage) {
        chrome.storage.local.get(key, data => {
          const value = data[key] ?? '';
          const output = Base64Helper.decrypt(value);
          resolve(output);
        });
      } else {
        const data = localStorage.getItem(key) as string;
        const output = Base64Helper.decrypt(data);

        resolve(output);
      }
    });
  }

  /**
   * @description
   * Updates/adds a value to local storage
   *
   * @param key The key to set
   * @param value The value to set
   */
  static set(key: string, value: string): Promise<void> {
    const input = Base64Helper.encrypt(value);

    return new Promise(async resolve => {
      if (chrome?.storage) {
        chrome.storage.local.set({ [key]: input }, () => resolve());
      } else {
        localStorage.setItem(key, input);
        resolve();
      }
    });
  }

  /**
   * @description
   * Clears the storage
   *
   * @param key The root key to get rid of
   */
  static clear(key: string): void {
    if (chrome?.storage) {
      chrome.storage.local.clear();
    } else {
      localStorage.removeItem(key);
    }
  }
}