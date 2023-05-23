/**
 * @description
 * Helper for icon management
 */
export class IconHelper {

  /**
   * @description
   * Returns the sanitized path to the icon.
   *
   * @param icon The name of the icon.
   * @param category The gategory of the image (containing folder).
   */
  static getIcon(icon: string, category: 'platforms' | 'graphs'): string {
    return chrome?.runtime ?
      chrome.runtime.getURL(`./images/${category}/${icon}.png`)
      : `./images/${category}/${icon}.png`;
  }
}
