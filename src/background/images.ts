/**
 * @description
 * Hosts cover images may be fetched from: MyAnimeList's CDN and YouTube's
 * image servers. Anything else is refused, so the background cannot be used
 * to fetch arbitrary URLs.
 */
const ALLOWED_IMAGE_HOSTS = [
  "cdn.myanimelist.net",
  "ggpht.com",
  "googleusercontent.com",
  "ytimg.com",
];

/**
 * @description
 * The largest image accepted, in bytes.
 */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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
 * Encodes bytes as base64, in chunks so large images do not exceed the
 * engine's argument limit.
 *
 * @param bytes - The bytes
 * @returns The base64 text
 */
export function bytesToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

/**
 * @description
 * Fetches an image and returns it as a data URL, so pages whose content
 * security policy blocks the image's host can still show it.
 *
 * @param url - The image URL
 * @returns Promise resolving to the data URL, or null if refused or failed
 */
export async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  if (!isAllowedImageUrl(url)) {
    return null;
  }

  try {
    const response = await fetch(url);
    const type = response.headers.get("content-type") ?? "";

    if (!response.ok || !type.startsWith("image/")) {
      return null;
    }

    const bytes = new Uint8Array(await response.arrayBuffer());

    if (bytes.length > MAX_IMAGE_BYTES) {
      return null;
    }

    return `data:${type};base64,${bytesToBase64(bytes)}`;
  }
  catch {
    return null;
  }
}
