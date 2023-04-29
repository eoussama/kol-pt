export class URLHelper {

  /**
   * @description
   * Decodes patreon embed link and returns raw vimeo src
   *
   * @param url The patreon embed link
   */
  static decode(url: string): string {

    // Getting the encoded patreon link
    const src = url.split('=')[1].split('&')[0];

    // Decoding the url
    return decodeURIComponent(src);
  }
}