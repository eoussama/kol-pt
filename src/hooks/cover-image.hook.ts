import { useEffect, useState } from "react";
import { EMessageType } from "../core/enums/message-type.enum";
import { MessageHelper } from "../core/helpers/navigator/message.helper";



/**
 * @description
 * Fetches an external image URL via the background service worker and returns
 * a data URL, bypassing the page's Content Security Policy.
 *
 * @param url - The external image URL to fetch
 * @returns The fetched image as a data URL, or null while loading / on error
 */
export function useCoverImage(url: string | null | undefined): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url || !url.startsWith("http")) {
      return;
    }

    setDataUrl(null);

    let settled = false;

    const handler = (raw: unknown) => {
      if (settled) {
        return;
      }

      const msg = raw as { type?: number; payload?: { dataUrl?: string | null } };

      if (msg?.type === EMessageType.FETCH_IMAGE_RESPONSE) {
        settled = true;
        setDataUrl(msg.payload?.dataUrl ?? null);
        chrome.runtime.onMessage.removeListener(handler);
      }
    };

    chrome.runtime.onMessage.addListener(handler);
    MessageHelper.send(EMessageType.FETCH_IMAGE, { url });

    return () => {
      chrome.runtime.onMessage.removeListener(handler);
    };
  }, [url]);

  return dataUrl;
}
