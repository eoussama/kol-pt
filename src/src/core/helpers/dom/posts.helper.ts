import { Post } from "../../models/post.model";
import { InjectHelper } from "./inject.helper";
import { PlayerHelper } from "./player.helper";



export class PostsHelper {

  /**
   * @description
   * Retrieves all target post elements
   *
   * @param postIds A list of target posts's IDs
   */
  static getPostsElements(postIds: Array<string>) {
    const posts: any = [];

    document
      .querySelectorAll('[data-tag="post-card"]')
      .forEach(post => {
        if (PostsHelper.isPostAllowed(post as HTMLDivElement, postIds)) {
          posts.push(post);
        }
      });

    return posts;
  }

  /**
   * @description
   * Attaches post details to DOM element
   *
   * @param post The post information to attach
   * @param postEl The target element on the DOM to attach to
   */
  static async attachToPost(post: Post, postEl: HTMLDivElement): Promise<void> {

    // Attaching metadata
    postEl.dataset['kol_pt'] = JSON.stringify(true);

    // Attaching raw player
    await PlayerHelper.attach(postEl);

    // Injecting post detail
    const sibling = (postEl.querySelector('[data-tag="post-content-collapse"]') ?? postEl.querySelector('[data-tag="post-content"]')) as HTMLDivElement;
    InjectHelper.postDetail(post, sibling);

    // Styling post
    postEl.style.borderRadius = '10px';
    postEl.style.boxShadow = '0 0 20px 0px rgba(25, 118, 210, 0.5)';
  }

  /**
   * @description
   * Checks if post element corresponds to a post
   * that's store on firebase.
   *
   * @param post The post element
   * @param postIds A list of allowed post IDs
   */
  private static isPostAllowed(post: HTMLDivElement, postIds: Array<string>) {
    const isLocked = post.querySelector('[data-tag="locked-image-post"]') != null;

    if (!isLocked) {
      for (const postId of postIds) {
        if (post.querySelector(`[href$="${postId}"]`) || window.location.href.endsWith(postId)) {
          post.dataset['kol_pt_id'] = postId;
          return true;
        }
      }
    }

    return false;
  }
}