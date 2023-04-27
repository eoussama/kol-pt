import ReactDOM from 'react-dom';
import { PostsHelper } from '../core/helpers/dom/posts.helper';
import { Post } from '../core/models/post.model';
import PostDetail from '../components/layout/post-detail/PostDetail';



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

    for (const post of postEls) {
      if (!post.dataset['kol_pt']) {
        const postWrapper = document.createElement("div");
        const postId = post.dataset['kol_pt_id'];
        const postData = posts.find(e => e.id === postId) as Post;

        ReactDOM.render(<PostDetail post={postData} />, postWrapper);
        post.querySelector('[data-tag="post-content-collapse"]').after(postWrapper);

        post.dataset['kol_pt'] = true;
        post.style.outline = '5px solid #1976d252';
      }
    }

    console.log({ postEls, posts });
  }
})();

export { }