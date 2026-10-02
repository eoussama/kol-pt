import type { Post } from "../core/domain/post";
import type { Tag } from "../core/domain/tag";

import { useEffect, useRef } from "react";
import { usePlayer } from "../content/player/PlayerProvider";
import { toDatabaseKey } from "../core/utils/watchlist";
import { useAuthStore } from "../state/auth.state";
import { useWatchlistStore } from "../state/watchlist.state";



/**
 * @description
 * The largest jump between two playback updates that still counts as
 * playing, in seconds. Players report the time a few times per second; a
 * bigger jump is a seek.
 */
const MAX_PLAYBACK_STEP_S = 3;

/**
 * @description
 * Lists the reactions that just finished playing: those whose end was
 * crossed between two playback updates, by playing rather than seeking.
 *
 * @param tags - The post's reactions
 * @param previous - The playhead at the previous update, in seconds
 * @param current - The playhead now, in seconds
 * @returns The reactions that ended in between
 */
export function findFinishedReactions(tags: ReadonlyArray<Tag>, previous: number, current: number): Array<Tag> {
  const step = current - previous;

  if (step <= 0 || step > MAX_PLAYBACK_STEP_S) {
    return [];
  }

  return tags.filter(tag => tag.endTime > previous && tag.endTime <= current);
}

/**
 * @description
 * Marks a post's reactions as watched when they finish playing, for a
 * signed-in user. Each reaction is handled once per page view, so one the
 * user unticks afterwards stays unticked.
 *
 * @param post - The post whose video is playing
 */
export function useAutoWatch(post: Post): void {
  const user = useAuthStore(e => e.user);
  const toggle = useWatchlistStore(e => e.toggle);
  const { currentTime, playing } = usePlayer();
  const previousTime = useRef<number | null>(null);
  const handled = useRef(new Set<string>());

  useEffect(() => {
    const previous = previousTime.current;

    previousTime.current = currentTime;

    if (!user || !playing || previous === null) {
      return;
    }

    const watched = useWatchlistStore.getState().posts.get(toDatabaseKey(post.id));

    for (const tag of findFinishedReactions(post.tags, previous, currentTime)) {
      if (handled.current.has(tag.id)) {
        continue;
      }

      handled.current.add(tag.id);

      if (!watched?.has(toDatabaseKey(tag.id))) {
        toggle(post.id, tag.id, true).catch(() => undefined);
      }
    }
  }, [currentTime, playing, user, post, toggle]);
}
