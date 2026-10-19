import { useEffect, useState } from "react";
import { request } from "../core/messaging/client";
import { isFetchableImageUrl } from "../core/utils/image-hosts";



/**
 * @description
 * How many images to keep while the page is open.
 */
const MAX_KEPT = 20;

/**
 * @description
 * The images already fetched, kept while the page is open so they show at
 * once when needed again, oldest first.
 */
const fetchedImages = new Map<string, string>();

/**
 * @description
 * Keeps a fetched image, forgetting the oldest beyond the limit.
 *
 * @param url - The image URL
 * @param result - What to show for it
 */
function keep(url: string, result: string): void {
  fetchedImages.delete(url);
  fetchedImages.set(url, result);

  if (fetchedImages.size > MAX_KEPT) {
    fetchedImages.delete(fetchedImages.keys().next().value!);
  }
}

/**
 * @description
 * Fetches an external image through the background and returns it as a data
 * URL, so it shows on pages whose content security policy blocks its host.
 * Images the background cannot fetch (AniList refuses it) are used as they
 * are, as is any image it fails to fetch.
 *
 * @param url - The external image URL
 * @returns The image as a data URL or, failing that, its URL; null while loading or for non-https URLs
 */
export function useCoverImage(url: string | null | undefined): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(() => {
    if (!url?.startsWith("https://")) {
      return null;
    }

    return fetchedImages.get(url) ?? (isFetchableImageUrl(url) ? null : url);
  });

  useEffect(() => {
    const known = url ? fetchedImages.get(url) : undefined;

    setDataUrl(known ?? null);

    if (known || !url?.startsWith("https://")) {
      return;
    }

    if (!isFetchableImageUrl(url)) {
      setDataUrl(url);

      return;
    }

    let active = true;
    const show = (result: string) => {
      keep(url, result);

      if (active) {
        setDataUrl(result);
      }
    };

    request("images.fetch", { url })
      .then(result => show(result ?? url))
      .catch(() => show(url));

    return () => {
      active = false;
    };
  }, [url]);

  return dataUrl;
}
