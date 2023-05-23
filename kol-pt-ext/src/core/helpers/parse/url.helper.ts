import { config } from '../../../config/env';



/**
 * @description
 * Helps with URLs
 */
export class URLHelper {

  /**
   * @description
   * The patreon url regex pattern
   */
  private static readonly PATREON_URL_RGX = new RegExp(`${config.patreonUrl}/*`, 'g');

  /**
   * @description
   * Decodes patreon embed link and returns raw vimeo src
   *
   * @param url The patreon embed link
   */
  static decode(url: string): string {

    // Getting the encoded patreon link
    const src = url?.split('=')[1]?.split('&')[0];

    // Decoding the url
    return decodeURIComponent(src);
  }

  /**
   * @description
   * Checks if url is within the Patreon domain
   *
   * @param url The URL to check
   */
  static isPatreon(url: string): boolean {
    return this.PATREON_URL_RGX.test(url ?? '');
  }
}