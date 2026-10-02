/**
 * @description
 * Player events the reactions panel reacts to.
 */
export type TPlayerEvent = "play" | "pause" | "timeupdate";

/**
 * @description
 * A video player inside a Patreon post, whatever its implementation.
 */
export interface IPlayerAdapter {

  /**
   * @description
   * The element to scroll into view when jumping to a reaction.
   */
  readonly element: HTMLElement;

  /**
   * @description
   * The playhead position in seconds.
   */
  getCurrentTime: () => number;

  /**
   * @description
   * Whether the video is playing.
   */
  isPlaying: () => boolean;

  /**
   * @description
   * Moves the playhead and starts playback.
   *
   * @param seconds - Where to start, in seconds
   */
  playFrom: (seconds: number) => Promise<void>;

  /**
   * @description
   * Moves the playhead without starting playback. If the video is not
   * loaded yet, the position is applied once it is.
   *
   * @param seconds - Where to start, in seconds
   */
  cue: (seconds: number) => void;

  /**
   * @description
   * Pauses playback.
   */
  pause: () => void;

  /**
   * @description
   * Subscribes to a player event.
   *
   * @param event - The event to listen to
   * @param listener - Called when the event fires
   * @returns A function that removes the listener
   */
  on: (event: TPlayerEvent, listener: () => void) => () => void;

  /**
   * @description
   * Removes every listener the adapter added. The player itself belongs to
   * Patreon and is left in place.
   */
  dispose: () => void;
}
