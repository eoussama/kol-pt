import type { IPlayerAdapter } from "./types";

import { PatreonSelectors } from "../patreon/selectors";
import { Html5VideoAdapter } from "./html5-video.adapter";
import { toVimeoPlayerUrl, VimeoIframeAdapter } from "./vimeo-iframe.adapter";



/**
 * @description
 * Creates an adapter for the player inside a post card, if there is one yet.
 * Patreon's native player is preferred over embedded iframes.
 *
 * @param card - The post card element
 * @returns The player adapter, or null if the card has no supported player
 */
export function createPlayer(card: Element): IPlayerAdapter | null {
  const video = card.querySelector<HTMLVideoElement>(PatreonSelectors.player.video);

  if (video) {
    return new Html5VideoAdapter(video);
  }

  for (const iframe of card.querySelectorAll<HTMLIFrameElement>(PatreonSelectors.iframe)) {
    const playerUrl = toVimeoPlayerUrl(iframe.src);

    if (playerUrl) {
      return new VimeoIframeAdapter(iframe, playerUrl);
    }
  }

  return null;
}

/**
 * @description
 * Resolves with the card's player as soon as it exists. Patreon renders
 * players lazily, so the card is observed until one appears.
 *
 * @param card - The post card element
 * @param signal - Stops waiting when aborted
 * @returns The player adapter, or null if aborted first
 */
export function waitForPlayer(card: Element, signal: AbortSignal): Promise<IPlayerAdapter | null> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve(null);

      return;
    }

    const existing = createPlayer(card);

    if (existing) {
      resolve(existing);

      return;
    }

    const observer = new MutationObserver(() => {
      const player = createPlayer(card);

      if (player) {
        observer.disconnect();
        resolve(player);
      }
    });

    observer.observe(card, { childList: true, subtree: true });

    signal.addEventListener("abort", () => {
      observer.disconnect();
      resolve(null);
    }, { once: true });
  });
}
