import { request } from "../core/messaging/client";
import { createMarkStore, usePostMarks } from "./mark-store";



/**
 * @description
 * State management store for the reactions the signed-in user watched. Kept
 * in sync with extension storage by `useWatchlistSync`.
 */
export const useWatchlistStore = createMarkStore((postId, tagId, watched) => request("watchlist.set", { postId, tagId, watched }));

/**
 * @description
 * A post's watched reactions, for its reactions' checkboxes.
 *
 * @param postId - The post's ID
 * @returns Whether a reaction is watched, whether a save is in flight for the post, and whether it is for a given reaction
 */
export function usePostWatchlist(postId: string) {
  const { isMarked, saving, isSaving } = usePostMarks(useWatchlistStore, postId);

  return { isWatched: isMarked, saving, isSaving };
}
