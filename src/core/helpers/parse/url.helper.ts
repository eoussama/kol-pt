import { getConfig } from "../../../config/env";



/**
 * @description
 * Helps with URLs
 */
export class URLHelper {
  /**
   * @description
   * Decodes patreon embed link and returns raw vimeo src
   *
   * @param url - The patreon embed link
   * @returns The decoded vimeo URL
   */
  static decode(url: string): string {
    // Getting the encoded patreon link
    const src = url?.split("=")[1]?.split("&")[0];

    // Decoding the url, leaving it untouched when there is nothing to decode
    return src ? decodeURIComponent(src) : url;
  }

  /**
   * @description
   * Checks if url is within the Patreon domain
   *
   * @param url - The URL to check
   * @returns True if the URL is a Patreon URL
   */
  static isPatreon(url: string): boolean {
    try {
      return new URL(url).origin === new URL(getConfig().patreonUrl).origin;
    }
    catch {
      return false;
    }
  }
}
