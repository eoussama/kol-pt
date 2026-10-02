import type { TEntry } from "../../core/schemas/entry/entry.schema";
import type { TEntryInput, TPostInput, TTagInput } from "../../core/schemas/moderation.schema";
import type { TPost } from "../../core/schemas/post.schema";

import { moderatorItem } from "../../core/storage/items";
import { toDatabaseKey } from "../../core/utils/watchlist";
import { readValue, updateValues, writeValue } from "../database";
import { getPostsWithEntries } from "./content";
import { isKeyed, toKeyed, withoutUndefined } from "./keyed";



/**
 * @description
 * The tracked posts and entries, as content changes answer them.
 */
export interface IContent {
  posts: Array<TPost>;
  entries: Array<TEntry>;
}

let queue: Promise<unknown> = Promise.resolve();

/**
 * @description
 * The optional fields the editors manage. One left empty is removed; any
 * other field already stored is kept, so editing never loses data the
 * editors do not show.
 */
const OPTIONAL_FIELDS = {
  entry: ["imdbId", "cover", "malId", "anilistId", "kitsuId", "handle", "channelId", "rottentomatoesId"],
  context: ["title", "videoId", "altTitles"],
} as const;

/**
 * @description
 * Merges an edited item over the stored one.
 *
 * @param stored - The stored item, if any
 * @param edited - The edited fields
 * @param optional - The optional fields the editor manages
 * @returns The item to store
 */
export function mergeEdit(stored: unknown, edited: object, optional: ReadonlyArray<string>): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...(stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {}), ...withoutUndefined(edited) };

  for (const field of optional) {
    if ((edited as Record<string, unknown>)[field] === undefined) {
      delete merged[field];
    }
  }

  return merged;
}

/**
 * @description
 * Runs content changes one at a time, so the one-time rewrite of the lists
 * cannot race another change.
 *
 * @param task - The change
 * @returns Promise resolving to the change's result
 */
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = queue.then(task);

  queue = result.catch(() => undefined);

  return result;
}

/**
 * @description
 * Whether a user is a moderator: `moderators/{uid}` is `true`. The database
 * rules enforce the same check on every write.
 *
 * @param uid - The user's ID
 * @returns Promise resolving to true for moderators
 */
export async function isModerator(uid: string): Promise<boolean> {
  try {
    return (await readValue(`moderators/${uid}`)) === true;
  }
  catch {
    // Unreadable means not theirs to read: not a moderator
    return false;
  }
}

/**
 * @description
 * Checks again whether a user is a moderator, and records it for the pages.
 *
 * @param uid - The user's ID, or null when signed out
 * @returns Promise resolving to true for moderators
 */
export async function refreshModerator(uid: string | null): Promise<boolean> {
  const moderator = uid ? await isModerator(uid) : false;

  await moderatorItem.setValue(uid ? { uid, moderator } : null);

  return moderator;
}

/**
 * @description
 * Rewrites the posts and entries as objects keyed by id if they are still
 * stored as arrays, so that changes can target one item. Readers accept both
 * shapes, so this is invisible to them.
 *
 * @returns Promise that resolves once both lists are keyed
 */
async function ensureKeyed(): Promise<void> {
  const [posts, entries] = await Promise.all([readValue("posts"), readValue("entries")]);

  if (!isKeyed(posts, "tags")) {
    await writeValue("posts", toKeyed(posts, "tags"));
  }

  if (!isKeyed(entries)) {
    await writeValue("entries", toKeyed(entries));
  }
}

/**
 * @description
 * Runs a content change, then answers with the fresh content. Refreshing the
 * cache also lets every open Patreon tab pick the change up.
 *
 * @param change - The change
 * @returns Promise resolving to the fresh posts and entries
 */
function change(change: () => Promise<void>): Promise<IContent> {
  return enqueue(async () => {
    await ensureKeyed();
    await change();

    return getPostsWithEntries(true);
  });
}

/**
 * @description
 * Tracks a post or updates its details, keeping its reactions.
 *
 * @param post - The post's details
 * @returns Promise resolving to the fresh content
 */
export function savePost(post: TPostInput): Promise<IContent> {
  return change(() => updateValues(`posts/${toDatabaseKey(post.id)}`, withoutUndefined(post)));
}

/**
 * @description
 * Stops tracking a post, with its reactions.
 *
 * @param postId - The post's ID
 * @returns Promise resolving to the fresh content
 */
export function deletePost(postId: string): Promise<IContent> {
  return change(() => writeValue(`posts/${toDatabaseKey(postId)}`, null));
}

/**
 * @description
 * Adds a reaction to a tracked post, or replaces one.
 *
 * @param postId - The post's ID
 * @param tag - The reaction
 * @returns Promise resolving to the fresh content
 */
export function saveTag(postId: string, tag: TTagInput): Promise<IContent> {
  return change(async () => {
    const path = `posts/${toDatabaseKey(postId)}`;

    if ((await readValue(`${path}/id`)) == null) {
      throw new Error("This post is not tracked");
    }

    const tagPath = `${path}/tags/${toDatabaseKey(tag.id)}`;
    const stored = await readValue(tagPath) as { context?: unknown } | null;
    const context = mergeEdit(stored?.context, tag.context, OPTIONAL_FIELDS.context);

    await writeValue(tagPath, { ...mergeEdit(stored, tag, []), context });
  });
}

/**
 * @description
 * Removes a reaction from a post.
 *
 * @param postId - The post's ID
 * @param tagId - The reaction's ID
 * @returns Promise resolving to the fresh content
 */
export function deleteTag(postId: string, tagId: string): Promise<IContent> {
  return change(() => writeValue(`posts/${toDatabaseKey(postId)}/tags/${toDatabaseKey(tagId)}`, null));
}

/**
 * @description
 * Adds an entry, or replaces one.
 *
 * @param entry - The entry
 * @returns Promise resolving to the fresh content
 */
export function saveEntry(entry: TEntryInput): Promise<IContent> {
  return change(async () => {
    const path = `entries/${toDatabaseKey(entry.id)}`;

    await writeValue(path, mergeEdit(await readValue(path), entry, OPTIONAL_FIELDS.entry));
  });
}
