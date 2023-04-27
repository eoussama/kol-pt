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
        if (PostsHelper.isPostAllowed(post, postIds)) {
          posts.push(post);
        }
      });

    return posts;
  }

  /**
   * @description
   * Checks if post element corresponds to a post
   * that's store on firebase.
   *
   * @param post The post element
   * @param postIds A list of allowed post IDs
   */
  private static isPostAllowed(post: any, postIds: Array<string>) {
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