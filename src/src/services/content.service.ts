import { Post } from '../core/models/post.model';
import { Imessage } from '../core/types/message.type';
import { MessageType } from '../core/enums/message-type.enum';
import { PostsHelper } from '../core/helpers/dom/posts.helper';
import { TimeHelper } from '../core/helpers/parse/time.helper';
import { MessageHelper } from '../core/helpers/navigator/message.helper';
import { ObserverHelper } from '../core/helpers/dom/observer.helper';



(() => {

  /**
   * @description
   * Last page initialization timestamp
   */
  let lastInit = 0;

  /**
   * @description
   * Last page attachement timestamp
   */
  let lastAttach = 0;

  /**
   * @description
   * Initialization timeout in milliseconds
   */
  const timeout = 2000;

  // Listening for messages
  chrome.runtime.onMessage.addListener((e: Imessage<{ posts: Array<Post> }>) => {

    if (TimeHelper.ellapsed(lastInit, timeout) || TimeHelper.ellapsed(lastAttach, timeout)) {
      switch (e.type) {
        case MessageType.Init: {
          lastInit = Date.now();

          PostsHelper.init().then(() => {

            // Triggering post load
            MessageHelper.send(e.tabId, MessageType.Load)

            const target = '[data-tag="post-card"]';
            const parent = document.getElementById('renderPageContentWrapper') as HTMLDivElement;

            // Periodic post update as the DOM mutates
            ObserverHelper.onAdded(parent, target, () => MessageHelper.send(e.tabId, MessageType.Load));
          });

          break;
        }

        case MessageType.Attach: {
          lastAttach = Date.now();

          PostsHelper.attach(e.payload?.posts ?? []);
          PostsHelper.clean();
          
          break;
        }
      }
    }
  });
})();

export { }