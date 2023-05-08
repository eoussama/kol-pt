import { Imessage } from '../core/types/message.type';
import { URLHelper } from '../core/helpers/parse/url.helper';
import { MessageType } from '../core/enums/message-type.enum';
import { PostsHelper } from '../core/helpers/firebase/posts.helper';
import { MessageHelper } from '../core/helpers/navigator/message.helper';
import { FirebaseHelper } from '../core/helpers/firebase/firebase.helper';



// Initializing firebase instance
FirebaseHelper.init();

// On update
chrome.webNavigation.onCompleted.addListener(async ({ tabId, url }) => {

  // On patreon page update
  if (URLHelper.isPatreon(url ?? '')) {

    // Sending initialization message to content
    MessageHelper.send(tabId, MessageType.Init);
  }
});

// On load message received
chrome.runtime.onMessage.addListener(async (e: Imessage, { tab }) => {

  // If content script is requesting posts
  if (tab?.id && e.type === MessageType.Load) {

    // Fetching the posts
    const posts = await PostsHelper.load();

    // Forwarding the fetched posts over to active page
    MessageHelper.send(tab.id, MessageType.Attach, { posts });
  }
});

export { }