import { config } from '../config/env';
import { Nullable } from '../core/types/nullable.type';
import { URLHelper } from '../core/helpers/parse/url.helper';
import { PostsHelper } from '../core/helpers/firebase/posts.helper';
import { FirebaseHelper } from '../core/helpers/firebase/firebase.helper';
import { RequestHelper } from '../core/helpers/chrome/request.helper';



// Keep track of the current tab ID
let currentTabId: Nullable<number>;

// Initializing firebase instance
FirebaseHelper.init();

// On update
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {

  // On patreon page update
  if (URLHelper.isPatreon(tab.url ?? '')) {

    // On fully loaded
    if ([undefined, 'complete'].includes(changeInfo.status)) {

      // Set the current tab ID
      currentTabId = tabId;

      // Fetching the posts
      const posts = await PostsHelper.load();

      // Waiting for requests to resolve
      await RequestHelper.wait();

      // Forwarding the fetched posts over to active page
      chrome.tabs.sendMessage(tabId, { action: 'attach', posts });

      // Intercepting all post potential update requests
      chrome.webRequest.onCompleted.addListener(onWebRequestCompleted, { urls: ['<all_urls>'] });
    } else if (changeInfo.status === 'loading') {

      // Remove the web request listener
      chrome.webRequest.onCompleted.removeListener(onWebRequestCompleted);

      // Set the current tab ID to null
      currentTabId = null;
    }
  }
});

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
    chrome.tabs.sendMessage(currentTabId, { action: 'attach', posts });
  }
}

export { }