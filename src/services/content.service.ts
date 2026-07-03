import type { Post } from "../core/models/post.model";
import type { Imessage } from "../core/types/message.type";

import { EMessageType } from "../core/enums/message-type.enum";
import { ObserverHelper } from "../core/helpers/dom/observer.helper";
import { PostsHelper } from "../core/helpers/dom/posts.helper";
import { MessageHelper } from "../core/helpers/navigator/message.helper";



(() => {
  const POST_CARD = "[data-tag=\"post-card\"]";

  function getParent(): HTMLDivElement {
    return (document.getElementById("main-content") ?? document.body) as HTMLDivElement;
  }

  MessageHelper.listen((e: Imessage<{ posts: Array<Post> }>) => {
    switch (e.type) {
      case EMessageType.INIT:
        PostsHelper.init().then(() => {
          MessageHelper.send(EMessageType.LOAD, null, e.tabId);
          ObserverHelper.onAdded(getParent(), POST_CARD, () => MessageHelper.send(EMessageType.LOAD, null, e.tabId));
        });
        break;

      case EMessageType.ATTACH:
        PostsHelper.attach(e.payload?.posts ?? []);
        PostsHelper.clean();
        break;
    }
  });
})();

export { };
