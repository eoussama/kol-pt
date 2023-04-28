import { FirebaseHelper } from "../core/helpers/firebase/firebase.helper";
import { PostsHelper } from "../core/helpers/firebase/posts.helper";



// eslint-disable-next-line
self.addEventListener('install', (event) => {
  FirebaseHelper.init();
});

// eslint-disable-next-line
self.addEventListener('activate', (event) => {
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {

    // On page load
    if (changeInfo.status === "complete") {

      // Fetching the posts
      const posts = await PostsHelper.load();

      // Forwarding the fetched posts over to active page
      chrome.tabs.sendMessage(tabId, { action: "attach", posts });
    }
  });
});

export { }