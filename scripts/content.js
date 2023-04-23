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
        const creatorLink = post.querySelector('.sc-ghlzfe').getAttribute('href');
        const creatorName = creatorLink.split('/').reverse()[0];

        if (creatorName === KOL_NAME) {
          posts.push(post);
        }
      });

    return posts;
  }
})();
