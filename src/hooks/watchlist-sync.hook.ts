import { useEffect } from "react";
import { watchlistItem } from "../core/storage/items";
import { useWatchlistStore } from "../state/watchlist.state";



/**
 * @description
 * Mirrors the watchlist from extension storage into the watchlist store, so a
 * change made in one tab shows in every tab. Use once per page, at the root.
 */
export function useWatchlistSync(): void {
  const setKeys = useWatchlistStore(e => e.setKeys);

  useEffect(() => {
    let active = true;

    watchlistItem.getValue().then((watchlist) => {
      if (active) {
        setKeys(watchlist?.keys ?? []);
      }
    }).catch(() => undefined);

    const unwatch = watchlistItem.watch(watchlist => setKeys(watchlist?.keys ?? []));

    return () => {
      active = false;
      unwatch();
    };
  }, [setKeys]);
}
