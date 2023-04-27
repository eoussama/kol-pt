// Function called when a new message is received
// const messagesFromReactAppListener = async (msg: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) => {
// const PATREON_URL = "https://www.patreon.com";
// const isAllowed = await isPatreon();

// if (isAllowed) {
//   chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
//     const data = { isAllowed, tabId: tabs[0].id };
//     chrome.tabs.sendMessage(tabs[0].id ?? -1, data);
//   });
// }

// function isPatreon() {
//   return new Promise(async resolve => {
//     try {
//       const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
//       const currentUrl = tabs[0].url;

//       resolve(currentUrl?.startsWith(PATREON_URL));
//     } catch {
//       resolve(false);
//     }
//   });
// }
// }

// chrome.runtime.onMessage.addListener(messagesFromReactAppListener);

import { config } from '../config/env';

(() => {
  const KOL_NAME = config.creatorName;

  init();

  function init() {
    setTimeout(() => {
      const posts = getPosts();
      console.log({ posts });
    }, 2000);
  }

  function getPosts() {
    const posts: any = [];

    document
      .querySelectorAll('[data-tag="post-card"]')
      .forEach(post => {
        if (isPostAllowed(post)) {
          posts.push(post);
        }
      });

    return posts;
  }

  function isPostAllowed(post: any) {
    const isLocked = post.querySelector('[data-tag="locked-image-post"]') != null;

    if (!isLocked) {

      // If on creator feed
      if (window.location.href.endsWith(`${KOL_NAME}/posts`)) {
        return true;
      }

      // If on post page
      if (post.querySelector('.sc-jJoQJp span')) {
        return true;
      }

      // If on general feed
      const creatorLink = post.querySelector('.sc-jJoQJp a').getAttribute('href');
      const creatorName = creatorLink.split('/').reverse()[0];

      return creatorName === KOL_NAME;
    }

    return false;
  }
})();

export { }