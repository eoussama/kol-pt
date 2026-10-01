import type { Post } from "../core/domain/post";
import type { Tag } from "../core/domain/tag";

import { useEffect, useMemo, useState } from "react";
import { toDatabaseKey, watchlistKey } from "../core/utils/watchlist";
import { usePostStore } from "../state/posts.state";
import { useWatchlistStore } from "../state/watchlist.state";



/**
 * @description
 * A watched reaction, with the post it is in.
 */
export interface IHistoryItem {
  post: Post;
  tag: Tag;

  /**
   * @description
   * When it was watched, or null for reactions marked before dates were recorded.
   */
  watchedAt: Date | null;
}

/**
 * @description
 * Lists the watched reactions of the tracked posts, most recently watched
 * first. Reactions without a watch date come last, newest post first.
 *
 * @param posts - The tracked posts, newest first
 * @param watched - The watched reaction ids of each post, by post (database keys)
 * @param watchedAt - When each reaction was watched, by watchlist key
 * @returns The history
 */
export function buildHistory(
  posts: ReadonlyArray<Post>,
  watched: ReadonlyMap<string, ReadonlySet<string>>,
  watchedAt: ReadonlyMap<string, number>,
): Array<IHistoryItem> {
  const items = posts.flatMap(post => post.tags
    .filter(tag => watched.get(toDatabaseKey(post.id))?.has(toDatabaseKey(tag.id)))
    .map((tag) => {
      const time = watchedAt.get(watchlistKey(post.id, tag.id));

      return { post, tag, watchedAt: time === undefined ? null : new Date(time) };
    }));

  // Stable sort: undated items keep the posts' newest-first order
  return items.sort((a, b) => (b.watchedAt?.getTime() ?? -1) - (a.watchedAt?.getTime() ?? -1));
}

/**
 * @description
 * The signed-in user's watch history, searchable.
 *
 * @returns The history and its loading state
 */
export function useHistory() {
  const [search, setSearch] = useState("");
  const posts = usePostStore(e => e.posts);
  const error = usePostStore(e => e.error);
  const loading = usePostStore(e => e.loading);
  const loadPosts = usePostStore(e => e.loadPosts);
  const watched = useWatchlistStore(e => e.posts);
  const watchedAt = useWatchlistStore(e => e.watchedAt);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const history = useMemo(() => buildHistory(posts, watched, watchedAt), [posts, watched, watchedAt]);
  const filtered = useMemo(() => history.filter(item => item.tag.entry?.match(search) || item.post.match(search) || item.tag.getTitle().toLowerCase().includes(search)), [history, search]);

  /**
   * @description
   * Handles list search
   *
   * @param e The search event object
   */
  const onSearch = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setSearch((e.target.value ?? "").toLowerCase());
  };

  return { error, loading, search, history: filtered, historyCount: history.length, onSearch };
}
