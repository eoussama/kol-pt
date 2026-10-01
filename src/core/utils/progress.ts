import type { Tag } from "../domain/tag";



/**
 * @description
 * Where the user stopped watching a post's video.
 */
export interface IProgress {

  /**
   * @description
   * The playhead position, in seconds.
   */
  time: number;

  /**
   * @description
   * When it was saved, in epoch milliseconds.
   */
  updatedAt: number;
}

/**
 * @description
 * Reads the saved positions as stored in the database,
 * `{ postId: { time, updatedAt } }`. Arrays (the SDK's reading of objects
 * keyed by small integers) are read by index, and malformed positions are
 * left out.
 *
 * @param value - The raw database value
 * @returns The saved positions, by post (database key)
 */
export function readProgress(value: unknown): Record<string, IProgress> {
  const progress: Record<string, IProgress> = {};

  if (!value || typeof value !== "object") {
    return progress;
  }

  for (const [postKey, node] of Object.entries(value)) {
    const { time, updatedAt } = (node && typeof node === "object" ? node : {}) as Partial<Record<keyof IProgress, unknown>>;

    if (typeof time === "number" && Number.isFinite(time) && time >= 0 && typeof updatedAt === "number" && Number.isFinite(updatedAt)) {
      progress[postKey] = { time, updatedAt };
    }
  }

  return progress;
}

/**
 * @description
 * Finds the reaction a position belongs to: the one playing there, else the
 * last one that started before it, else the first one.
 *
 * @param tags - The post's reactions
 * @param time - The position, in seconds
 * @returns The reaction, or null if the post has none
 */
export function findReactionAt(tags: ReadonlyArray<Tag>, time: number): Tag | null {
  const playing = tags.find(tag => tag.startTime <= time && time < tag.endTime);

  if (playing) {
    return playing;
  }

  const started = tags.filter(tag => tag.startTime <= time).sort((a, b) => b.startTime - a.startTime);

  return started[0] ?? [...tags].sort((a, b) => a.startTime - b.startTime)[0] ?? null;
}
