import type { Post } from "../core/models/post.model";
import type { Imessage } from "../core/types/message.type";
import { EMessageType } from "../core/enums/message-type.enum";
import { ObserverHelper } from "../core/helpers/dom/observer.helper";
import { PostsHelper } from "../core/helpers/dom/posts.helper";
import { MessageHelper } from "../core/helpers/navigator/message.helper";
import { TimeHelper } from "../core/helpers/parse/time.helper";



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
  MessageHelper.listen((e: Imessage<{ posts: Array<Post> }>) => {
    if (TimeHelper.ellapsed(lastInit, timeout) || TimeHelper.ellapsed(lastAttach, timeout)) {
      switch (e.type) {
        case EMessageType.INIT: {
          lastInit = Date.now();

          PostsHelper.init().then(() => {
            // Triggering post load
            MessageHelper.send(EMessageType.LOAD, null, e.tabId);

            const target = "[data-tag=\"post-card\"]";
            const parent = document.getElementById("renderPageContentWrapper") as HTMLDivElement;

            // Periodic post update as the DOM mutates
            ObserverHelper.onAdded(parent, target, () => MessageHelper.send(EMessageType.LOAD, null, e.tabId));
          });

          break;
        }

        case EMessageType.ATTACH: {
          lastAttach = Date.now();

          PostsHelper.attach(e.payload?.posts ?? []);
          PostsHelper.clean();

          break;
        }
      }
    }
  });
})();

export { };
