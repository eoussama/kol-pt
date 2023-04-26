import { IPost } from "../types/post.type";
import { Post } from "../models/post.model";
import { get, ref } from "firebase/database";
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
   */
  static async load(): Promise<Array<Post>> {
    const data: Array<IPost> = (await get(ref(FirebaseHelper.getDb(), this.DB_KEY))).val();
    const posts: Array<Post> = [];

    for (let i = 0; i < data.length; i++) {
      const post = new Post(data[i]);

      for (let j = 0; j < post.tags.length; j++) {
        const entry = await EntriesHelper.get(data[i].tags[j].entryId);

        if (entry) {
          post.tags[j].entry = entry;
        }
      }

      posts.push(post);
    }

    return posts.sort((a: any, b: any) => b.creationDate - a.creationDate);
  }
}