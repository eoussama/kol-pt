import { Post } from "../../models/post.model";
import { InjectHelper } from "./inject.helper";
import { PlayerHelper } from "./player.helper";



export class PostsHelper {

  /**
   * @description
   * Attaches loading indicator to posts
   */
  static init(): void {
    document
      .querySelectorAll('[data-tag="post-card"]')
      .forEach(post => {
        if (!PostsHelper.isPostLocked(post as HTMLDivElement) && !post.querySelector('[data-kol_pt_loader="true"]')) {
          const sibling = InjectHelper.getInjectionTarget(post as HTMLDivElement);
          InjectHelper.postLoader(sibling);
        }
      });
  }

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
   * Initializes the attachments
   *
   * @param posts The list of target posts
   */
  static attach(posts: Array<Post>) {
    const postIds = posts.map(post => post.id);
    const postEls = PostsHelper.getPostsElements(postIds);

    for (const postEl of postEls) {
      if (!postEl.dataset['kol_pt']) {
        const postId = postEl.dataset['kol_pt_id'];
        const post = new Post(posts.find(e => e.id === postId) as any);

        PostsHelper.attachToPost(post, postEl);
      }
    }
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
    const sibling = InjectHelper.getInjectionTarget(postEl);
    InjectHelper.postDetail(post, sibling);

    // Styling post
    postEl.style.borderRadius = '10px';
    postEl.style.boxShadow = '0 0 20px 0px rgba(25, 118, 210, 0.5)';

    // Removing the loader
    postEl.querySelector('[data-kol_pt_loader="true"]')?.remove();
  }

  /**
   * @description
   * Checks if post element is locked for user
   *
   * @param post The post element
   */
  private static isPostLocked(post: HTMLDivElement) {
    const isLocked = post.querySelector('[data-tag="locked-image-post"]') != null;
    return isLocked;
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
    if (!this.isPostLocked(post)) {
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