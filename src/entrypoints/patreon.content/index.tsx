import { createRoot } from "react-dom/client";
import { defineContentScript } from "wxt/utils/define-content-script";
import { CardRegistry } from "../../content/mount/card-registry";
import { EmbedController } from "../../content/mount/embed-controller";
import { EmbedRoot } from "../../content/mount/EmbedRoot";
import { watchCards } from "../../content/patreon/card-watcher";
import { hydratePosts } from "../../core/domain/hydrate";
import { request } from "../../core/messaging/client";



export default defineContentScript({
  matches: ["https://www.patreon.com/*"],
  runAt: "document_end",
  main(ctx) {
    const registry = new CardRegistry();
    const controller = new EmbedController(registry);

    // Panels render into their cards through portals, so the root itself
    // never needs to be attached to the page
    const root = createRoot(document.createElement("div"));

    root.render(<EmbedRoot registry={registry} />);

    // Without tracked posts (e.g. offline), the loaders are removed
    request("posts.list", {})
      .then(({ posts, entries }) => hydratePosts(posts, entries))
      .catch(() => [])
      .then((posts) => {
        if (ctx.isValid) {
          controller.setPosts(posts);
        }
      });

    // Cards appear after load, on infinite scroll and on client-side navigation
    watchCards({ signal: ctx.signal, onChange: () => controller.sync() });
    ctx.addEventListener(window, "wxt:locationchange", () => controller.sync());

    ctx.onInvalidated(() => {
      controller.dispose();
      root.unmount();
    });
  },
});
