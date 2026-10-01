import type { Post } from "../core/domain/post";
import type { Tag } from "../core/domain/tag";
import type { IProgress } from "../core/utils/progress";

import { useEffect, useMemo, useState } from "react";
import { findReactionAt } from "../core/utils/progress";
import { toDatabaseKey, watchlistKey } from "../core/utils/watchlist";
import { useFavoritesStore } from "../state/favorites.state";
import { usePostStore } from "../state/posts.state";
import { useProgressStore } from "../state/progress.state";
import { useWatchlistStore } from "../state/watchlist.state";



/**
 * @description
 * Which reactions the history lists.
 */
export type THistoryKind = "watched" | "favorites" | "continue";

/**
 * @description
 * A marked reaction (watched or favorite), with the post it is in.
 */
export interface IHistoryItem {
  post: Post;
  tag: Tag;

  /**
   * @description
   * When it was marked, or null for reactions marked before dates were
   * recorded. For a post to continue, when its position was saved.
   */
  markedAt: Date | null;

  /**
   * @description
   * For a post to continue, where the user stopped watching, in seconds.
   */
  resumeAt?: number;
}

/**
 * @description
 * Lists the marked reactions of the tracked posts, most recently marked
 * first. Reactions without a watch date come last, newest post first.
 *
 * @param posts - The tracked posts, newest first
 * @param marked - The marked reaction ids of each post, by post (database keys)
 * @param markedAt - When each reaction was marked, by watchlist key
 * @returns The history
 */
export function buildHistory(
  posts: ReadonlyArray<Post>,
  marked: ReadonlyMap<string, ReadonlySet<string>>,
  markedAt: ReadonlyMap<string, number>,
): Array<IHistoryItem> {
  const items = posts.flatMap(post => post.tags
    .filter(tag => marked.get(toDatabaseKey(post.id))?.has(toDatabaseKey(tag.id)))
    .map((tag) => {
      const time = markedAt.get(watchlistKey(post.id, tag.id));

      return { post, tag, markedAt: time === undefined ? null : new Date(time) };
    }));

  // Stable sort: undated items keep the posts' newest-first order
  return items.sort((a, b) => (b.markedAt?.getTime() ?? -1) - (a.markedAt?.getTime() ?? -1));
}

/**
 * @description
 * Lists the posts the user stopped watching partway, most recently watched
 * first, each with the reaction they stopped in.
 *
 * @param posts - The tracked posts
 * @param progress - The saved positions, by post (database key)
 * @returns The posts to continue
 */
export function buildContinueList(posts: ReadonlyArray<Post>, progress: ReadonlyMap<string, IProgress>): Array<IHistoryItem> {
  const items = posts.flatMap((post): Array<IHistoryItem> => {
    const saved = progress.get(toDatabaseKey(post.id));
    const tag = saved ? findReactionAt(post.tags, saved.time) : null;

    return saved && tag ? [{ post, tag, markedAt: new Date(saved.updatedAt), resumeAt: saved.time }] : [];
  });

  return items.sort((a, b) => (b.markedAt?.getTime() ?? 0) - (a.markedAt?.getTime() ?? 0));
}

/**
 * @description
 * The signed-in user's watched reactions, favorites or posts to continue, searchable.
 *
 * @param kind - Which reactions to list
 * @returns The history and its loading state
 */
export function useHistory(kind: THistoryKind) {
  const [search, setSearch] = useState("");
  const posts = usePostStore(e => e.posts);
  const error = usePostStore(e => e.error);
  const loading = usePostStore(e => e.loading);
  const loadPosts = usePostStore(e => e.loadPosts);
  const watchedPosts = useWatchlistStore(e => e.posts);
  const watchedAt = useWatchlistStore(e => e.markedAt);
  const favoritePosts = useFavoritesStore(e => e.posts);
  const favoritedAt = useFavoritesStore(e => e.markedAt);
  const progress = useProgressStore(e => e.posts);
  const marked = kind === "watched" ? watchedPosts : favoritePosts;
  const markedAt = kind === "watched" ? watchedAt : favoritedAt;

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const history = useMemo(
    () => kind === "continue" ? buildContinueList(posts, progress) : buildHistory(posts, marked, markedAt),
    [kind, posts, progress, marked, markedAt],
  );
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
