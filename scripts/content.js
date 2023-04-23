(async () => {
  const KOL_NAME = 'KingOfLightning';

  await init();

  // chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  //   if (request.isAllowed) {

  //   }
  // });

  function init() {
    setTimeout(() => {
      const posts = getPosts();
      console.log({ posts });
    }, 2000);
  }

  function getPosts() {
    const posts = [];

    document
      .querySelectorAll('[data-tag="post-card"]')
      .forEach(post => {
        if (isPostAllowed(post)) {
          posts.push(post);
        }
      });

    return posts;
  }

  function isPostAllowed(post) {
    const isLocked = post.querySelector('[data-tag="locked-image-post"]') != null;

    if (!isLocked) {
      if (window.location.href.endsWith(`${KOL_NAME}/posts`)) {
        return true;
      }
      
      const creatorLink = post.querySelector('.sc-jJoQJp a').getAttribute('href');
      const creatorName = creatorLink.split('/').reverse()[0];

      return creatorName === KOL_NAME;
    }

    return false;
  }
})();
