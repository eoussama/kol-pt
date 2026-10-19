import { useEffect } from "react";
import { entriesCacheItem, postsCacheItem } from "../core/storage/items";
import { useEntriesStore } from "../state/entries.state";
import { usePostStore } from "../state/posts.state";



/**
 * @description
 * Reloads the posts and entries shown whenever the background refreshes its
 * cache of them, e.g. after a moderator saves a change. Use once per page,
 * at the root.
 */
export function useContentSync(): void {
  useEffect(() => {
    const unwatchPosts = postsCacheItem.watch(() => {
      if (usePostStore.getState().posts.length > 0) {
        usePostStore.getState().loadPosts();
      }
    });
    const unwatchEntries = entriesCacheItem.watch(() => {
      if (useEntriesStore.getState().entries.length > 0) {
        useEntriesStore.getState().loadEntries();
      }
    });

    return () => {
      unwatchPosts();
      unwatchEntries();
    };
  }, []);
}
