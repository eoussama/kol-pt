import { useEffect, useState } from "react";
import { request } from "../core/messaging/client";



/**
 * @description
 * Fetches an external image through the background and returns it as a data
 * URL, so it shows on pages whose content security policy blocks its host.
 *
 * @param url - The external image URL
 * @returns The image as a data URL, or null while loading, on error, or for non-https URLs
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
          setDataUrl(result);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [url]);

  return dataUrl;
}
