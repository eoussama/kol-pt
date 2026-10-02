import type { IPlayerAdapter, TPlayerEvent } from "./types";

import Vimeo from "@vimeo/player";



/**
 * @description
 * The host Vimeo's embeddable player is served from.
 */
const VIMEO_PLAYER_HOST = "player.vimeo.com";

/**
 * @description
 * Finds the direct Vimeo player URL for an iframe. Older Patreon posts embed
 * Vimeo through a wrapper page that carries the Vimeo URL, encoded, in one of
 * its query parameters.
 *
 * @param src - The iframe's source
 * @returns The Vimeo player URL, or null if the iframe is not a Vimeo video
 */
export function toVimeoPlayerUrl(src: string): string | null {
  let url: URL;

  try {
    url = new URL(src);
  }
  catch {
    return null;
  }

  if (url.hostname === VIMEO_PLAYER_HOST) {
    return url.href;
  }

  for (const value of url.searchParams.values()) {
    try {
      const inner = new URL(value);

      if (inner.hostname === VIMEO_PLAYER_HOST) {
        return inner.href;
      }
    }
    catch {
      // Not a URL, keep looking
    }
  }

  return null;
}

/**
 * @description
 * Drives a Vimeo iframe, used by older embedded posts.
 */
export class VimeoIframeAdapter implements IPlayerAdapter {
  readonly element: HTMLElement;

  private readonly player: Vimeo;

  private currentTime = 0;

  private playing = false;

  private readonly disposers: Array<() => void> = [];

  /**
   * @description
   * Creates an adapter for a Vimeo iframe, pointing it at the Vimeo player
   * directly if it goes through a wrapper page.
   *
   * @param iframe - The iframe element
   * @param playerUrl - The direct Vimeo player URL
   */
  constructor(iframe: HTMLIFrameElement, playerUrl: string) {
    if (iframe.src !== playerUrl) {
      iframe.src = playerUrl;
    }

    this.element = iframe;
    this.player = new Vimeo(iframe);

    // Registered before any external listener, so state is current when they run
    const onTimeUpdate = (data: { seconds: number }) => {
      this.currentTime = data.seconds;
    };
    const onPlay = () => {
      this.playing = true;
    };
    const onPause = () => {
      this.playing = false;
    };

    this.player.on("timeupdate", onTimeUpdate);
    this.player.on("play", onPlay);
    this.player.on("pause", onPause);

    this.disposers.push(
      () => this.player.off("timeupdate", onTimeUpdate),
      () => this.player.off("play", onPlay),
      () => this.player.off("pause", onPause),
    );
  }

  /**
   * @description
   * The playhead position.
   *
   * @returns The position in seconds
   */
  getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * @description
   * Whether the video is playing.
   *
   * @returns True while playing
   */
  isPlaying(): boolean {
    return this.playing;
  }

  /**
   * @description
   * Moves the playhead and starts playback.
   *
   * @param seconds - Where to start, in seconds
   * @returns Promise that resolves once playback was requested
   */
  async playFrom(seconds: number): Promise<void> {
    await this.player.setCurrentTime(seconds);
    await this.player.play();
  }

  /**
   * @description
   * Moves the playhead without starting playback, once the video is loaded if it is not yet.
   *
   * @param seconds - Where to start, in seconds
   */
  cue(seconds: number): void {
    this.player.setCurrentTime(seconds).catch(() => undefined);
  }

  /**
   * @description
   * Pauses playback.
   */
  pause(): void {
    this.player.pause().catch(() => undefined);
  }

  /**
   * @description
   * Subscribes to a player event.
   *
   * @param event - The event to listen to
   * @param listener - Called when the event fires
   * @returns A function that removes the listener
   */
  on(event: TPlayerEvent, listener: () => void): () => void {
    const handler = () => listener();
    const remove = () => this.player.off(event, handler);

    this.player.on(event, handler);
    this.disposers.push(remove);

    return remove;
  }

  /**
   * @description
   * Removes every listener the adapter added.
   */
  dispose(): void {
    this.disposers.splice(0).forEach(dispose => dispose());
  }
}
