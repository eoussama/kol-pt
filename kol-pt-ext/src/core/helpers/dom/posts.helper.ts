import type { Post } from "../../models/post.model";
import { InjectHelper } from "./inject.helper";
import { ObserverHelper } from "./observer.helper";
import { PlayerHelper } from "./player.helper";



/**
 * @description
 * Helper that handles all treatments on post DOM elements
 */
export class PostsHelper {
  /**
   * @description
   * Attaches loading indicator to posts
   *
   * @returns Promise that resolves when init is complete
   */
  static async init(): Promise<void> {
    const target = "[data-tag=\"post-card\"]";
    const parent = document.getElementById("renderPageContentWrapper") as HTMLDivElement;

    await ObserverHelper.onAddedOnce(parent, target);

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        document
          .querySelectorAll(target)
          .forEach((post) => {
            const postEl = post as HTMLDivElement;

            // Checking if the post is available for the user
            if (!PostsHelper.isPostLocked(postEl as HTMLDivElement) && !postEl.dataset.kol_pt_loader) {
              const sibling = InjectHelper.getInjectionTarget(postEl as HTMLDivElement);

              InjectHelper.postLoader(postEl as HTMLDivElement, sibling);
            }
          });

        resolve();
      });
    });
  }

  /**
   * @description
   * Cleans up posts after injection, removes loaders.
   */
  static clean(): void {
    document
      .querySelectorAll("[data-tag=\"post-card\"][data-kol_pt_loader]")
      .forEach((post) => {
        const postEl = post as HTMLDivElement;

        postEl.removeAttribute("data-kol_pt_loader");
        postEl.querySelector("[data-kol_pt_loader]")?.remove();
      });
  }

  /**
   * @description
   * Retrieves all target post elements
   *
   * @param postIds - A list of target posts's IDs
   * @returns Array of matching post DOM elements
   */
  static getPostsElements(postIds: Array<string>): Array<HTMLDivElement> {
    const posts: Array<HTMLDivElement> = [];

    document
      .querySelectorAll("[data-tag=\"post-card\"]")
      .forEach((post) => {
        if (PostsHelper.isPostAllowed(post as HTMLDivElement, postIds)) {
          posts.push(post as HTMLDivElement);
        }
      });

    return posts;
  }

  /**
   * @description
   * Initializes the attachments
   *
   * @param posts - The list of target posts
   */
  static attach(posts: Array<Post>): void {
    const postIds = posts.map(post => post.id);
    const postEls = PostsHelper.getPostsElements(postIds);

    for (const postEl of postEls) {
      if (!postEl.dataset.kol_pt) {
        const postId = postEl.dataset.kol_pt_id;
        const postData = posts.find(e => e.id === postId);

        if (postData) {
          PostsHelper.attachToPost(postData, postEl);
        }
      }
    }
  }

  /**
   * @description
   * Attaches post details to DOM element
   *
   * @param post - The post information to attach
   * @param postEl - The target element on the DOM to attach to
   * @returns Promise that resolves when attachment is complete
   */
  static async attachToPost(post: Post, postEl: HTMLDivElement): Promise<void> {
    // Attaching metadata
    postEl.dataset.kol_pt = JSON.stringify(true);

    // Attaching raw player
    await PlayerHelper.attach(postEl);

    // Injecting post detail
    const sibling = InjectHelper.getInjectionTarget(postEl);

    InjectHelper.postDetail(post, sibling);

    // Styling post
    postEl.style.borderRadius = "10px";
    postEl.style.boxShadow = "0 0 20px 0px rgba(25, 118, 210, 0.5)";

    // Removing the loader
    postEl.removeAttribute("data-kol_pt_loader");
    postEl.querySelector("[data-kol_pt_loader]")?.remove();
  }

  /**
   * @description
   * Checks if post element is locked for user
   *
   * @param post - The post element
   * @returns True if the post is locked
   */
  private static isPostLocked(post: HTMLDivElement): boolean {
    const isLocked = post.querySelector("[data-tag=\"locked-image-post\"]") != null;

    return isLocked;
  }

  /**
   * @description
   * Checks if post element corresponds to a post
   * that's store on firebase.
   *
   * @param post - The post element
   * @param postIds - A list of allowed post IDs
   * @returns True if the post is allowed
   */
  private static isPostAllowed(post: HTMLDivElement, postIds: Array<string>): boolean {
    if (!this.isPostLocked(post)) {
      for (const postId of postIds) {
        if (post.querySelector(`[href$="${postId}"]`) || window.location.href.endsWith(postId)) {
          post.dataset.kol_pt_id = postId;

          return true;
        }
      }
    }

    return false;
  }
}
