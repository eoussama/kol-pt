import { Post } from "../../models/post.model";
import { InjectHelper } from "./inject.helper";
import { PlayerHelper } from "./player.helper";



/**
 * @description
 * Helper that handles all treatments on post DOM elements
 */
export class PostsHelper {

  /**
   * @description
   * Attaches loading indicator to posts
   */
  static init(): Promise<void> {
    return new Promise(resolve => {

      // Defining mutation observer on the main content
      const observer = new MutationObserver(mutations => {

        // If any posts were added
        if (mutations.some(e =>

          // Checking if any nodes were added
          e.addedNodes.length > 0

          // Checking if any of the added nodes are post elements
          && (e.target as HTMLDivElement).closest('#renderPageContentWrapper')?.querySelector('[data-tag="post-card"]')
        )) {

          // Discarding observer
          observer.disconnect();

          setTimeout(() => {
            document
              .querySelectorAll('[data-tag="post-card"]')
              .forEach(post => {
                const postEl = post as HTMLDivElement;

                // Checking if the post is available for the user
                if (!PostsHelper.isPostLocked(postEl as HTMLDivElement) && !Boolean(postEl.dataset['kol_pt_loader'])) {
                  const sibling = InjectHelper.getInjectionTarget(postEl as HTMLDivElement);

                  InjectHelper.postLoader(postEl as HTMLDivElement, sibling);
                }
              });

            resolve();
          });
        }
      });

      // Observe mutations on the page
      observer.observe(document.getElementById('renderPageContentWrapper') as any, { childList: true, subtree: true });
    });
  }

  /**
   * @description
   * Cleans up posts after injection, removes loaders.
   */
  static clean(): void {
    document
      .querySelectorAll('[data-tag="post-card"][data-kol_pt_loader]')
      .forEach(post => {
        const postEl = post as HTMLDivElement;

        postEl.removeAttribute('data-kol_pt_loader');
        postEl.querySelector('[data-kol_pt_loader]')?.remove();
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
    postEl.removeAttribute('data-kol_pt_loader');
    postEl.querySelector('[data-kol_pt_loader]')?.remove();
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