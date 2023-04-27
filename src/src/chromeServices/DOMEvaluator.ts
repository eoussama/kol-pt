import { PostsHelper } from '../core/helpers/dom/posts.helper';
import { Post } from '../core/models/post.model';



(() => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'attach') {
      // const el = document.createElement("div");
      // document.body.appendChild(el);
      // ReactDOM.render(<MyComponent />, el);
      // console.log('attach', { message, sender, sendResponse });

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
        const el = document.createElement('span');

        el.innerHTML = 'TARGER POST<br>TARGER POST<br>TARGER POST<br>TARGER POST<br>TARGER POST<br>TARGER POST<br>TARGER POST<br>';
        el.style.color = 'red';

        post.dataset['kol_pt'] = true;
        post.style.borderRadius = '10px';
        post.style.border = '5px solid #1976d252';
        post.querySelector('[data-tag="post-content-collapse"]').after(el);
      }
    }

    console.log({ postEls, posts });
  }
})();

export { }