import type { Imessage } from "../core/types/message.type";
import { EMessageType } from "../core/enums/message-type.enum";
import { AuthHelper } from "../core/helpers/firebase/auth.helper";
import { PostsHelper } from "../core/helpers/firebase/repositories/posts.helper";
import { MessageHelper } from "../core/helpers/navigator/message.helper";
import { URLHelper } from "../core/helpers/parse/url.helper";



// On update
chrome.webNavigation.onCompleted.addListener(async ({ tabId, url }) => {
  // On patreon page update
  if (URLHelper.isPatreon(url ?? "")) {
    // Sending initialization message to content
    MessageHelper.send(EMessageType.INIT, null, tabId);
  }
});

// On load message received
MessageHelper.listen(async (e: Imessage, { tab }) => {
  switch (e.type) {
    // If content script is requesting posts
    case EMessageType.LOAD: {
      if (tab?.id) {
        // Fetching the posts
        const posts = await PostsHelper.load();

        // Forwarding the fetched posts over to active page
        MessageHelper.send(EMessageType.ATTACH, { posts }, tab.id);
      }

      break;
    }

    // If state request is due
    case EMessageType.SYNC_REQUEST: {
      if (tab?.id) {
        AuthHelper.onChange(user => MessageHelper.send(EMessageType.SYNC_RESPONSE, user, tab.id));
      }

      break;
    }
  }
});

export { };
