import type { IPost } from "../../../types/post.type";

import { Post } from "../../../models/post.model";
import { EntriesHelper } from "./entries.helper";
import { RepositoryHelper } from "./repository.helper";



/**
 * @description
 * Helps with managing posts
 */
export class PostsHelper {
  /**
   * @description
   * The name of the key that stors the posts
   * on the realtime database
   */
  private static readonly DB_KEY = "posts";

  /**
   * @description
   * Returns the list of all posts
   *
   * @param cache - Whether to use cache when needed
   * @returns Promise resolving to an array of Post instances
   */
  static async load(cache: boolean = true): Promise<Array<Post>> {
    const data = await RepositoryHelper.get<Array<IPost> | null>(this.DB_KEY, cache);
    const posts: Array<Post> = [];

    for (const model of data ?? []) {
      const post = new Post(model);

      for (const [index, tag] of post.tags.entries()) {
        const entryId = model.tags[index]?.entryId;
        const entry = entryId ? await EntriesHelper.get(entryId, cache) : undefined;

        if (entry) {
          tag.entry = entry;
        }
      }

      post.tags = post.tags.sort((a, b) => a.startTime - b.startTime);
      posts.push(post);
    }

    return posts.sort((a: Post, b: Post) => b.creationDate.getTime() - a.creationDate.getTime());
  }
}
