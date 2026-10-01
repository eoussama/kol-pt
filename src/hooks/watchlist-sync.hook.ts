import { useEffect } from "react";
import { favoritesItem, watchlistItem } from "../core/storage/items";
import { useFavoritesStore } from "../state/favorites.state";
import { useWatchlistStore } from "../state/watchlist.state";



/**
 * @description
 * Mirrors the watchlist and the favorites from extension storage into their
 * stores, so a change made in one tab shows in every tab. Use once per page,
 * at the root.
 */
export function useWatchlistSync(): void {
  const setWatched = useWatchlistStore(e => e.setKeys);
  const setFavorites = useFavoritesStore(e => e.setKeys);

  useEffect(() => {
    let active = true;

    watchlistItem.getValue().then((list) => {
      if (active) {
        setWatched(list?.keys ?? [], list?.watchedAt);
      }
    }).catch(() => undefined);

    favoritesItem.getValue().then((list) => {
      if (active) {
        setFavorites(list?.keys ?? [], list?.watchedAt);
      }
    }).catch(() => undefined);

    const unwatchWatched = watchlistItem.watch(list => setWatched(list?.keys ?? [], list?.watchedAt));
    const unwatchFavorites = favoritesItem.watch(list => setFavorites(list?.keys ?? [], list?.watchedAt));

    return () => {
      active = false;
      unwatchWatched();
      unwatchFavorites();
    };
  }, [setWatched, setFavorites]);
}
