import { Post } from '../core/models/post.model';
import { PostsHelper } from '../core/helpers/dom/posts.helper';



(() => {
  let lastInit = 0;
  const timeout = 500;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'attach' && canInit()) {
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
    console.log({ posts });
    const postIds = posts.map(post => post.id);
    const postEls = PostsHelper.getPostsElements(postIds);

    for (const postEl of postEls) {
      if (!postEl.dataset['kol_pt']) {
        const postId = postEl.dataset['kol_pt_id'];
        const post = new Post(posts.find(e => e.id === postId) as any);

        PostsHelper.attachToPost(post, postEl);
      }
    }

    console.log({ posts });
    lastInit = Date.now();
  }

  /**
   * @description
   * Checks if initialization timeout has passed
   */
  function canInit(): boolean {
    return lastInit + timeout < Date.now();
  }
})();

export { }