import { IPost } from "../../types/post.type";
import { Post } from "../../models/post.model";
import { EntriesHelper } from "./entries.helper";
import { FirebaseHelper } from "./firebase.helper";



export class PostsHelper {

  /**
   * @description
   * The name of the key that stors the posts
   * on the realtime database
   */
  private static readonly DB_KEY = 'posts';

  /**
   * @description
   * Returns the list of all posts
   *
   * @param cache Whether to use cache when needed
   */
  static async load(cache: boolean = true): Promise<Array<Post>> {
    const data: Array<IPost> = await FirebaseHelper.get(this.DB_KEY, cache);
    const posts: Array<Post> = [];

    for (let i = 0; i < data.length; i++) {
      const post = new Post(data[i]);

      for (let j = 0; j < post.tags.length; j++) {
        const entry = await EntriesHelper.get(data[i].tags[j].entryId, cache);

        if (entry) {
          post.tags[j].entry = entry;
        }
      }

      posts.push(post);
    }

    return posts.sort((a: any, b: any) => b.creationDate - a.creationDate);
  }
}