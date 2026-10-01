import type { PublicPath } from "wxt/browser";

import { browser } from "wxt/browser";



/**
 * @description
 * Helper for icon management
 */
export class IconHelper {
  /**
   * @description
   * Returns the extension URL of a bundled image.
   *
   * @param icon - The name of the icon
   * @param category - The category of the image (containing folder)
   * @returns The resolved icon URL path
   */
  static getIcon(icon: string, category: "platforms" | "graphs"): string {
    return browser.runtime.getURL(`/images/${category}/${icon}.png` as PublicPath);
  }
}
