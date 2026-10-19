import { useEffect, useState } from "react";
import { request } from "../core/messaging/client";



/**
 * @description
 * The thumbnails last loaded, kept while the page is open so the list shows
 * them at once when it is shown again.
 */
let lastCovers: Record<string, string> = {};

/**
 * @description
 * Thumbnails for the entries without a cover of their own (anime and YouTube
 * channels), by entry ID. The list shows them as they arrive.
 *
 * @returns The thumbnails found so far
 */
export function useEntryCovers(): Record<string, string> {
  const [covers, setCovers] = useState(lastCovers);

  useEffect(() => {
    let active = true;

    request("entries.covers", {})
      .then((found) => {
        lastCovers = found;

        if (active) {
          setCovers(found);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  return covers;
}
