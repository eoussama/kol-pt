import { config } from "../config/env";
import { FirebaseHelper } from "../core/helpers/firebase/firebase.helper";
import { PostsHelper } from "../core/helpers/firebase/posts.helper";


// Initializing firebase instance
FirebaseHelper.init();

// On update
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, _) => {

  // On page load
  if (changeInfo.status === "complete") {

    // Fetching the posts
    const posts = await PostsHelper.load();

    // Forwarding the fetched posts over to active page
    chrome.tabs.sendMessage(tabId, { action: "attach", posts });

    // Intercepting all post potential update requests
    chrome.webRequest.onCompleted.addListener(e => {
      if (
        e.initiator === config.patreonUrl
        && ['posts', 'stream'].some(route => e.url.startsWith(`${config.patreonUrl}/api/${route}`))
      ) {

        // Forwarding the fetched posts over to active page
        chrome.tabs.sendMessage(tabId, { action: "attach", posts });
      }
    }, { urls: ['<all_urls>'] });
  }
});

export { }