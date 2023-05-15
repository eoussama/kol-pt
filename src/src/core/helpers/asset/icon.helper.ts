/**
 * @description
 * Helper for icon management
 */
export class IconHelper {

  /**
   * @description
   * Returns the sanitized path to the icon
   *
   * @param icon The name of the icon
   */
  static getIcon(icon: string, category: 'platforms'): string {
    return chrome?.runtime ?
      chrome.runtime.getURL(`./images/${category}/${icon}.png`)
      : `./images/${category}/${icon}.png`;
  }
}
