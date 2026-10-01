import type { PublicPath } from "wxt/browser";

import { browser } from "wxt/browser";



/**
 * @description
 * Folders of bundled images.
 */
export type TImageCategory = "platforms" | "graphs";

/**
 * @description
 * Returns the extension URL of a bundled PNG image, usable from extension
 * pages and from content scripts (the images are web-accessible on Patreon).
 *
 * @param name - The image's file name, without extension
 * @param category - The image's folder
 * @returns The image URL
 */
export function getImageUrl(name: string, category: TImageCategory): string {
  return browser.runtime.getURL(`/images/${category}/${name}.png` as PublicPath);
}

/**
 * @description
 * The image shown when a cover is missing or still loading.
 *
 * @returns The placeholder image URL
 */
export function getPlaceholderUrl(): string {
  return getImageUrl("placeholder", "graphs");
}
