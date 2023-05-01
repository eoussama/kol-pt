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
      if (chrome) {
        chrome.storage.local.get(key, data => resolve(data[key]));
      } else {
        const data = localStorage.getItem(key) as string;
        resolve(data);
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
  static set(key: string, value: any): Promise<void> {
    return new Promise(async resolve => {
      if (chrome) {
        chrome.storage.local.set({ [key]: value }, () => resolve());
      } else {
        localStorage.setItem(key, value);
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
    if (chrome) {
      chrome.storage.local.clear();
    } else {
      localStorage.removeItem(key);
    }
  }
}