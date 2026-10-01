import type { TEntry } from "../../core/schemas/entry/entry.schema";
import type { TPost } from "../../core/schemas/post.schema";

import { EntryListSchema } from "../../core/schemas/entry/entry.schema";
import { PostListSchema } from "../../core/schemas/post.schema";
import { entriesCacheItem, postsCacheItem } from "../../core/storage/items";
import { cached } from "../cache";
import { readValue } from "../database";



/**
 * @description
 * Returns the tracked posts, validated, from the cache while it is fresh.
 *
 * @param force - Whether to bypass the cache
 * @returns Promise resolving to the posts' data
 */
export function getPosts(force = false): Promise<Array<TPost>> {
  return cached(postsCacheItem, async () => PostListSchema.parse(await readValue("posts")), { force });
}

/**
 * @description
 * Returns the entries, validated, from the cache while it is fresh.
 *
 * @param force - Whether to bypass the cache
 * @returns Promise resolving to the entries' data
 */
export function getEntries(force = false): Promise<Array<TEntry>> {
  return cached(entriesCacheItem, async () => EntryListSchema.parse(await readValue("entries")), { force });
}

/**
 * @description
 * Returns the tracked posts with every entry they refer to. If a post refers
 * to an entry missing from the cache, the entries are refreshed once, since
 * posts and entries are cached separately and may be out of step.
 *
 * @param force - Whether to bypass the cache
 * @returns Promise resolving to the posts' and entries' data
 */
export async function getPostsWithEntries(force = false): Promise<{ posts: Array<TPost>; entries: Array<TEntry> }> {
  const posts = await getPosts(force);
  let entries = await getEntries(force);

  const known = new Set(entries.map(entry => entry.id));
  const hasUnknown = posts.some(post => post.tags.some(tag => !known.has(tag.entryId)));

  if (hasUnknown && !force) {
    entries = await getEntries(true);
  }

  return { posts, entries };
}
