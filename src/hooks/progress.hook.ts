import type { Post } from "../core/domain/post";

import { useEffect, useRef } from "react";
import { usePlayer } from "../content/player/PlayerProvider";
import { request } from "../core/messaging/client";
import { toDatabaseKey } from "../core/utils/watchlist";
import { useAuthStore } from "../state/auth.state";
import { useProgressStore } from "../state/progress.state";



/**
 * @description
 * How often the position is saved while the video plays, in milliseconds.
 */
export const PROGRESS_SAVE_INTERVAL_MS = 15000;

/**
 * @description
 * Positions before this, in seconds, are not worth resuming.
 */
export const MIN_RESUME_S = 10;

/**
 * @description
 * The smallest change of position, in seconds, worth saving again.
 */
const MIN_CHANGE_S = 1;

/**
 * @description
 * What to do with a position: save it, forget the post's saved one (every
 * reaction has been played through), or nothing.
 *
 * @param post - The post
 * @param time - The position, in seconds
 * @returns The position to save, null to forget it, or undefined for nothing
 */
export function toSavedPosition(post: Post, time: number): number | null | undefined {
  const end = Math.max(0, ...post.tags.map(tag => tag.endTime));

  if (end > 0 && time >= end) {
    return null;
  }

  return time >= MIN_RESUME_S ? Math.floor(time) : undefined;
}

/**
 * @description
 * Saves where a signed-in user is in a post's video: every
 * `PROGRESS_SAVE_INTERVAL_MS` while it plays, when it pauses, and when the
 * page is hidden or the panel goes away. Once every reaction has been played
 * through, the saved position is forgotten.
 *
 * @param post - The post whose video is tracked
 */
export function useProgressTracking(post: Post): void {
  const user = useAuthStore(e => e.user);
  const { currentTime, playing } = usePlayer();
  const latest = useRef({ time: currentTime, playing });
  // What this page last sent: a position, null once forgotten, undefined before anything
  const sentTime = useRef<number | null | undefined>(undefined);
  const sentAt = useRef(0);
  const wasPlaying = useRef(false);
  const uid = user?.uid ?? null;

  latest.current = { time: currentTime, playing };

  // Kept in a ref so the page listeners below always save with the latest state
  const save = useRef<(time: number) => void>(() => undefined);

  save.current = (time: number) => {
    const position = toSavedPosition(post, time);
    const previous = sentTime.current;

    if (!uid || position === undefined) {
      return;
    }

    if (position === null
      ? previous === null || !useProgressStore.getState().posts.has(toDatabaseKey(post.id))
      : typeof previous === "number" && Math.abs(previous - position) < MIN_CHANGE_S) {
      return;
    }

    sentTime.current = position;
    sentAt.current = Date.now();
    request("progress.set", { postId: post.id, time: position }).catch(() => undefined);
  };

  useEffect(() => {
    if (playing) {
      if (!wasPlaying.current) {
        // Counting from the start of playback, not from an earlier save
        sentAt.current = Date.now();
      }
      else if (Date.now() - sentAt.current >= PROGRESS_SAVE_INTERVAL_MS) {
        save.current(currentTime);
      }
    }
    else if (wasPlaying.current) {
      save.current(currentTime);
    }

    wasPlaying.current = playing;
  }, [currentTime, playing]);

  useEffect(() => {
    const flush = () => {
      if (latest.current.playing) {
        save.current(latest.current.time);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        flush();
      }
    };

    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      flush();
    };
  }, []);
}
