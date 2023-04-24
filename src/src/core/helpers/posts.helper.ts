import { get, ref } from "firebase/database";
import { IPost } from "../types/post.type";
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
  static async load(): Promise<Array<IPost>> {
    const data = await get(ref(FirebaseHelper.getDb(), this.DB_KEY));
    return data.val();
  }
}