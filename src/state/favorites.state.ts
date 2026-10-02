import { request } from "../core/messaging/client";
import { createMarkStore, usePostMarks } from "./mark-store";



/**
 * @description
 * State management store for the reactions the signed-in user favorited.
 * Kept in sync with extension storage by `useWatchlistSync`.
 */
export const useFavoritesStore = createMarkStore((postId, tagId, favorite) => request("favorites.set", { postId, tagId, favorite }));

/**
 * @description
 * A post's favorite reactions, for its reactions' hearts.
 *
 * @param postId - The post's ID
 * @returns Whether a reaction is a favorite, whether a save is in flight for the post, and whether it is for a given reaction
 */
export function usePostFavorites(postId: string) {
  const { isMarked, saving, isSaving } = usePostMarks(useFavoritesStore, postId);

  return { isFavorite: isMarked, saving, isSaving };
}
