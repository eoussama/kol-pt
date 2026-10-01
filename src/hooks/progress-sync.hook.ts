import { useEffect } from "react";
import { progressItem } from "../core/storage/items";
import { useProgressStore } from "../state/progress.state";



/**
 * @description
 * Mirrors the saved positions from extension storage into their store, so a
 * position saved in one tab shows in every tab. Use once per page, at the root.
 */
export function useProgressSync(): void {
  const setPosts = useProgressStore(e => e.setPosts);

  useEffect(() => {
    let active = true;

    progressItem.getValue().then((stored) => {
      if (active) {
        setPosts(stored?.posts);
      }
    }).catch(() => undefined);

    const unwatch = progressItem.watch(stored => setPosts(stored?.posts));

    return () => {
      active = false;
      unwatch();
    };
  }, [setPosts]);
}
