import { useEffect, useState } from "react";
import { request } from "../core/messaging/client";



/**
 * @description
 * Fetches an external image through the background and returns it as a data
 * URL, so it shows on pages whose content security policy blocks its host.
 * Some hosts refuse the background (AniList answers it without CORS): their
 * images are then used as they are.
 *
 * @param url - The external image URL
 * @returns The image as a data URL or, failing that, its URL; null while loading or for non-https URLs
 */
export function useCoverImage(url: string | null | undefined): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    setDataUrl(null);

    if (!url?.startsWith("https://")) {
      return;
    }

    let active = true;

    request("images.fetch", { url })
      .then((result) => {
        if (active) {
          setDataUrl(result ?? url);
        }
      })
      .catch(() => {
        if (active) {
          setDataUrl(url);
        }
      });

    return () => {
      active = false;
    };
  }, [url]);

  return dataUrl;
}
