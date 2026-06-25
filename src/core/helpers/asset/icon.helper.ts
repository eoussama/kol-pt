/**
 * @description
 * Helper for icon management
 */
export class IconHelper {
  /**
   * @description
   * Returns the sanitized path to the icon.
   *
   * @param icon - The name of the icon
   * @param category - The category of the image (containing folder)
   * @returns The resolved icon URL path
   */
  static getIcon(icon: string, category: "platforms" | "graphs"): string {
    return chrome?.runtime
      ? chrome.runtime.getURL(`./images/${category}/${icon}.png`)
      : `./images/${category}/${icon}.png`;
  }
}
