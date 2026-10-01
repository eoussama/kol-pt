import type { IPlayerAdapter, TPlayerEvent } from "./types";

import { PatreonSelectors } from "../patreon/selectors";



/**
 * @description
 * How long after a jump the adapter watches for Patreon restoring its own
 * saved position, in milliseconds.
 */
const RESUME_GUARD_MS = 4000;

/**
 * @description
 * How far, in seconds, the playhead may drift from a requested jump before
 * the adapter puts it back.
 */
const RESUME_TOLERANCE_S = 2;

/**
 * @description
 * Drives Patreon's native player, a `<video>` element fed through Media Source
 * Extensions (`blob:` source, `preload="none"`). Until the viewer first
 * presses play, no media is attached, so the adapter presses Patreon's own
 * Play button and applies the position once metadata has loaded.
 */
export class Html5VideoAdapter implements IPlayerAdapter {
  readonly element: HTMLElement;

  private pendingCue: number | null = null;

  private readonly disposers: Array<() => void> = [];

  /**
   * @description
   * Creates an adapter for a video element.
   *
   * @param video - Patreon's video element
   */
  constructor(private readonly video: HTMLVideoElement) {
    this.element = video.closest<HTMLElement>(PatreonSelectors.player.root) ?? video;
    this.listen("loadedmetadata", () => this.applyCue());
  }

  /**
   * @description
   * The playhead position.
   *
   * @returns The position in seconds
   */
  getCurrentTime(): number {
    return this.video.currentTime;
  }

  /**
   * @description
   * Whether the video is playing.
   *
   * @returns True while playing
   */
  isPlaying(): boolean {
    return !this.video.paused && !this.video.ended;
  }

  /**
   * @description
   * Moves the playhead without starting playback, once the video is loaded if it is not yet.
   *
   * @param seconds - Where to start, in seconds
   */
  cue(seconds: number): void {
    this.pendingCue = seconds;

    if (this.hasMetadata()) {
      this.applyCue();
    }
  }

  /**
   * @description
   * Moves the playhead and starts playback.
   *
   * @param seconds - Where to start, in seconds
   * @returns Promise that resolves once playback was requested
   */
  async playFrom(seconds: number): Promise<void> {
    this.cue(seconds);
    this.guardPosition(seconds);
    await this.start();
  }

  /**
   * @description
   * Pauses playback.
   */
  pause(): void {
    this.video.pause();
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
    return this.listen(event, listener);
  }

  /**
   * @description
   * Removes every listener the adapter added.
   */
  dispose(): void {
    this.disposers.splice(0).forEach(dispose => dispose());
  }

  /**
   * @description
   * Whether the media's duration and dimensions are known, which is when
   * the playhead can be moved.
   *
   * @returns True once metadata has loaded
   */
  private hasMetadata(): boolean {
    return this.video.readyState >= HTMLMediaElement.HAVE_METADATA;
  }

  /**
   * @description
   * Moves the playhead to the pending position, if any.
   */
  private applyCue(): void {
    if (this.pendingCue !== null) {
      this.video.currentTime = this.pendingCue;
      this.pendingCue = null;
    }
  }

  /**
   * @description
   * Starts playback. Before the first play the media is not attached, and
   * only Patreon's player knows how to attach it, so its Play button is
   * pressed instead of calling `play()` directly.
   *
   * @returns Promise that resolves once playback was requested
   */
  private async start(): Promise<void> {
    if (this.isPlaying()) {
      return;
    }

    const playButton = this.element.querySelector<HTMLButtonElement>(PatreonSelectors.player.playButton);

    if (!this.hasMetadata() && playButton) {
      playButton.click();

      return;
    }

    try {
      await this.video.play();
    }
    catch {
      playButton?.click();
    }
  }

  /**
   * @description
   * Puts the playhead back if Patreon restores a saved position shortly
   * after a jump.
   *
   * @param seconds - The requested position
   */
  private guardPosition(seconds: number): void {
    const startedAt = Date.now();

    const remove = this.listen("playing", () => {
      remove();

      if (Date.now() - startedAt <= RESUME_GUARD_MS && Math.abs(this.video.currentTime - seconds) > RESUME_TOLERANCE_S) {
        this.video.currentTime = seconds;
      }
    });
  }

  /**
   * @description
   * Adds a listener to the video element that is removed on dispose.
   *
   * @param event - The media event
   * @param listener - The listener
   * @returns A function that removes the listener
   */
  private listen(event: string, listener: () => void): () => void {
    this.video.addEventListener(event, listener);

    const remove = () => {
      this.video.removeEventListener(event, listener);

      const index = this.disposers.indexOf(remove);

      if (index >= 0) {
        this.disposers.splice(index, 1);
      }
    };

    this.disposers.push(remove);

    return remove;
  }
}
