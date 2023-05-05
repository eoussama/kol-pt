import { PostsHelper } from '../core/helpers/dom/posts.helper';
import { TimeHelper } from '../core/helpers/parse/time.helper';



(() => {

  /**
   * @description
   * Last page initialization timestamp
   */
  let lastInit = 0;

  /**
   * @description
   * Initialization timeout in milliseconds
   */
  const timeout = 500;

  // Listening for messages
  chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {

    // Initializinh attachments
    if (message.action === 'attach' && TimeHelper.ellapsed(lastInit, timeout)) {
      PostsHelper.init();
      PostsHelper.attach(message.posts);
      PostsHelper.clean();

      lastInit = Date.now();
    }
  });
})();

export { }