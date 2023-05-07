import { config } from '../config/env';
import { Nullable } from '../core/types/nullable.type';
import { MessageType } from '../core/enums/message-type.enum';
import { URLHelper } from '../core/helpers/parse/url.helper';
import { PostsHelper } from '../core/helpers/firebase/posts.helper';
import { RequestHelper } from '../core/helpers/chrome/request.helper';
import { MessageHelper } from '../core/helpers/navigator/message.helper';
import { FirebaseHelper } from '../core/helpers/firebase/firebase.helper';



// Keep track of the current tab ID
let currentTabId: Nullable<number>;

// Initializing firebase instance
FirebaseHelper.init();

// On update
chrome.webNavigation.onCompleted.addListener(async ({ tabId, url }) => {

  // On patreon page update
  if (URLHelper.isPatreon(url ?? '')) {

    // Set the current tab ID
    currentTabId = tabId;

    // Sending initialization message to content
    await MessageHelper.send(tabId, MessageType.Init);

    // Fetching the posts
    const posts = await PostsHelper.load();

    // Waiting for requests to resolve
    await RequestHelper.wait();

    // Forwarding the fetched posts over to active page
    await MessageHelper.send(tabId, MessageType.Attach, { posts });

    // Intercepting all post potential update requests
    chrome.webRequest.onCompleted.addListener(onWebRequestCompleted, { urls: ['<all_urls>'] });
  }
});

// Cleanung up old requests handlers
chrome.tabs.onUpdated.addListener((_, { url, status }) => {

  // If the page is still loading
  if (URLHelper.isPatreon(url ?? '') && status === 'loading') {

    // Remove the web request listener
    chrome.webRequest.onCompleted.removeListener(onWebRequestCompleted);

    // Set the current tab ID to null
    currentTabId = null;
  }
})

// Web request completed handler
async function onWebRequestCompleted(e: chrome.webRequest.WebResponseCacheDetails) {
  if (
    currentTabId
    && e.initiator === config.patreonUrl
    && ['posts', 'stream'].some(route => e.url.startsWith(`${config.patreonUrl}/api/${route}?`))
  ) {

    // Fetching the posts
    const posts = await PostsHelper.load();
    // Forwarding the fetched posts over to active page

    MessageHelper.send(currentTabId, MessageType.Attach, { posts });
  }
}

export { }