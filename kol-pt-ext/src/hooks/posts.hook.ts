import { useEffect, useMemo, useState } from "react";
import { usePostStore } from "../state/posts.state";



/**
 * @description
 * A custom hook to manage posts and filtering
 *
 *
 * @returns An object containing a function for serching and meta
 * vars about the posts
 */
export function usePosts() {
  const [search, setSearch] = useState('');
  const posts = usePostStore(e => e.posts);
  const error = usePostStore(e => e.error);
  const loading = usePostStore(e => e.loading);
  const loadPosts = usePostStore(e => e.loadPosts);
  const filteredPosts = useMemo(() => posts.filter(post => post.match(search)), [search, posts]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  /**
   * @description
   * Handles list search
   *
   * @param e The search event object
   */
  const onSearch = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const value = (e.target.value ?? '').toLowerCase();
    setSearch(value);
  }

  return { error, loading, search, posts: filteredPosts, postsCount: posts.length, onSearch };
}