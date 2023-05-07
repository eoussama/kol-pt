import { Post } from '../core/models/post.model';
import { Imessage } from '../core/types/message.type';
import { MessageType } from '../core/enums/message-type.enum';
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
  chrome.runtime.onMessage.addListener((message: Imessage<{ posts: Array<Post> }>, sender, sendResponse) => {

    if (TimeHelper.ellapsed(lastInit, timeout)) {
      switch (message.type) {
        case MessageType.Init: {
          PostsHelper.init();
          lastInit = Date.now();

          break;
        }

        case MessageType.Attach: {
          PostsHelper.attach(message.payload?.posts ?? []);
          PostsHelper.clean();

          break;
        }
      }

      // Notifying the sender
      sendResponse();

      // This return is important to ensure asynchronousity
      return true;
    }
  });
})();

export { }