/**
 * @description
 * Hosts cover images may come from: MyAnimeList, AniList, Kitsu, TMDB, IMDb,
 * Wikimedia, Rotten Tomatoes and YouTube. Anything else is refused, so the
 * background cannot be used to fetch arbitrary URLs.
 */
const ALLOWED_IMAGE_HOSTS = [
  "cdn.myanimelist.net",
  "s4.anilist.co",
  "media.kitsu.app",
  "media.kitsu.io",
  "image.tmdb.org",
  "m.media-amazon.com",
  "upload.wikimedia.org",
  "resizing.flixster.com",
  "ggpht.com",
  "googleusercontent.com",
  "ytimg.com",
];

/**
 * @description
 * Whether an image URL may be fetched.
 *
 * @param url - The image URL
 * @returns True for https URLs on an allowed host or one of its subdomains
 */
export function isAllowedImageUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);

    return protocol === "https:" && ALLOWED_IMAGE_HOSTS.some(host => hostname === host || hostname.endsWith(`.${host}`));
  }
  catch {
    return false;
  }
}

/**
 * @description
 * The hosts, as a readable list for messages.
 */
export const ALLOWED_IMAGE_SITES = "MyAnimeList, AniList, Kitsu, TMDB, IMDb, Wikimedia, Rotten Tomatoes or YouTube";

/**
 * @description
 * Allowed hosts that refuse the background's requests (AniList's CDN answers
 * them without a usable CORS header), so their images are shown as they are
 * instead of failing, and logging an error, on every fetch.
 */
const UNFETCHABLE_IMAGE_HOSTS = ["s4.anilist.co"];

/**
 * @description
 * Whether the background can fetch an image, to pass it on as a data URL.
 *
 * @param url - The image URL
 * @returns True for allowed images whose host accepts the background's requests
 */
export function isFetchableImageUrl(url: string): boolean {
  return isAllowedImageUrl(url) && !UNFETCHABLE_IMAGE_HOSTS.includes(new URL(url).hostname);
}
