import { Post } from '../core/models/post.model';
import { PostsHelper } from '../core/helpers/dom/posts.helper';



(() => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'attach') {
      init(message.posts);
    }
  });

  /**
   * @description
   * Initializes the attachments
   *
   * @param posts The list of target posts
   */
  function init(posts: Array<Post>) {
    const postIds = posts.map(post => post.id);
    const postEls = PostsHelper.getPostsElements(postIds);

    for (const postEl of postEls) {
      if (!postEl.dataset['kol_pt']) {
        const postId = postEl.dataset['kol_pt_id'];
        const post = posts.find(e => e.id === postId) as Post;

        PostsHelper.attachToPost(post, postEl);
      }
    }

    console.log({ postEls, posts });
  }
})();

export { }