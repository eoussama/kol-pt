import type { IReaction } from "../../../domain/hydrate";
import type { Post } from "../../../domain/post";
import type { TEntry } from "../../../schemas/entry/entry.schema";
import type { TPost } from "../../../schemas/post.schema";

import { findReactions, hydratePosts } from "../../../domain/hydrate";
import { PostListSchema } from "../../../schemas/post.schema";
import { EntriesHelper } from "./entries.helper";
import { RepositoryHelper } from "./repository.helper";



/**
 * @description
 * Helps with managing posts
 */
export class PostsHelper {
  /**
   * @description
   * The name of the key that stores the posts
   * on the realtime database
   */
  private static readonly DB_KEY = "posts";

  /**
   * @description
   * Returns the validated data of all posts, with the entries they refer to
   *
   * @param cache - Whether to use cache when needed
   * @returns Promise resolving to the posts' and entries' data
   */
  static async loadData(cache: boolean = true): Promise<{ posts: Array<TPost>; entries: Array<TEntry> }> {
    // Sequential: both update the same cache record
    const posts = PostListSchema.parse(await RepositoryHelper.get<unknown>(this.DB_KEY, cache));
    const entries = await EntriesHelper.loadData(cache);

    return { posts, entries };
  }

  /**
   * @description
   * Returns the list of all posts, newest first
   *
   * @param cache - Whether to use cache when needed
   * @returns Promise resolving to an array of Post instances
   */
  static async load(cache: boolean = true): Promise<Array<Post>> {
    const { posts, entries } = await this.loadData(cache);

    return hydratePosts(posts, entries);
  }

  /**
   * @description
   * Retrieves the reactions to an entry
   *
   * @param entryId - The ID of the entry
   * @param cache - Whether to use cache when needed
   * @returns Promise resolving to the reactions, newest first
   */
  static async getReactions(entryId: string, cache: boolean = true): Promise<Array<IReaction>> {
    return findReactions(await this.load(cache), entryId);
  }
}
