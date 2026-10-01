import { createRoot } from "react-dom/client";
import { defineContentScript } from "wxt/utils/define-content-script";
import { CardRegistry } from "../../content/mount/card-registry";
import { EmbedController } from "../../content/mount/embed-controller";
import { EmbedRoot } from "../../content/mount/EmbedRoot";
import { watchCards } from "../../content/patreon/card-watcher";
import { watchPatreonTheme } from "../../content/patreon/theme-watcher";
import { hydratePosts } from "../../core/domain/hydrate";
import { request } from "../../core/messaging/client";
import { patreonColorModeItem } from "../../core/storage/items";
import { applyThemeAttribute } from "../../core/theme/color-mode";
import { useThemeStore } from "../../state/theme.state";



export default defineContentScript({
  matches: ["https://www.patreon.com/*"],
  runAt: "document_end",
  main(ctx) {
    // Panels follow Patreon's appearance; the popup follows the last one seen
    const refreshTheme = watchPatreonTheme({
      signal: ctx.signal,
      onCheck: mode => applyThemeAttribute(mode),
      onChange: (mode, patreonMode) => {
        useThemeStore.getState().setMode(mode);
        patreonColorModeItem.setValue(patreonMode).catch(() => undefined);
      },
    });

    const registry = new CardRegistry();
    const controller = new EmbedController(registry);

    // Panels render into their cards through portals, so the root itself
    // never needs to be attached to the page
    const root = createRoot(document.createElement("div"));

    root.render(<EmbedRoot registry={registry} />);

    // The background serves posts from its cache, so they are asked for again
    // on every client-side navigation: this picks up newly tracked posts and
    // recovers from a failed first load
    let loaded = false;
    const loadPosts = () => request("posts.list", {})
      .then(({ posts, entries }) => {
        loaded = true;

        if (ctx.isValid) {
          controller.setPosts(hydratePosts(posts, entries));
        }
      })
      .catch(() => {
        // Without posts yet (e.g. offline), the loaders are removed
        if (ctx.isValid && !loaded) {
          controller.setPosts([]);
        }
      });

    loadPosts();

    // Cards appear after load, on infinite scroll and on client-side navigation
    watchCards({
      signal: ctx.signal,
      onChange: () => {
        controller.sync();
        refreshTheme();
      },
    });
    ctx.addEventListener(window, "wxt:locationchange", () => {
      controller.sync();
      loadPosts();
    });

    ctx.onInvalidated(() => {
      applyThemeAttribute("light");
      controller.dispose();
      root.unmount();
    });
  },
});
