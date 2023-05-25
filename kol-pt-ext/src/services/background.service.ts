import { Imessage } from '../core/types/message.type';
import { URLHelper } from '../core/helpers/parse/url.helper';
import { MessageType } from '../core/enums/message-type.enum';
import { AuthHelper } from '../core/helpers/firebase/auth.helper';
import { PostsHelper } from '../core/helpers/firebase/posts.helper';
import { MessageHelper } from '../core/helpers/navigator/message.helper';



// On update
chrome.webNavigation.onCompleted.addListener(async ({ tabId, url }) => {

  // On patreon page update
  if (URLHelper.isPatreon(url ?? '')) {

    // Sending initialization message to content
    MessageHelper.send(MessageType.Init, null, tabId);
  }
});

// On load message received
MessageHelper.listen(async (e: Imessage, { tab }) => {

  switch (e.type) {

    // If content script is requesting posts
    case MessageType.Load: {
      if (tab?.id) {

        // Fetching the posts
        const posts = await PostsHelper.load();

        // Forwarding the fetched posts over to active page
        MessageHelper.send(MessageType.Attach, { posts }, tab.id);
      }

      break;
    }

    // If state request is due
    case MessageType.SyncRequest: {
      if (tab?.id) {
        AuthHelper.onChange(user => MessageHelper.send(MessageType.SyncResponse, user, tab.id));
      }

      break;
    }
  }
});

export { }