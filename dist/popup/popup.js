
(async () => {
  const PATREON_URL = "https://www.patreon.com";
  const isAllowed = await isPatreon();

  if (isAllowed) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const data = { isAllowed, tabId: tabs[0].id };
      chrome.tabs.sendMessage(tabs[0].id, data);
    });
  }

  function isPatreon() {
    return new Promise(async resolve => {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentUrl = tabs[0].url;

        resolve(currentUrl.startsWith(PATREON_URL));
      } catch {
        resolve(false);
      }
    });
  }
})();