import { createRoot } from "react-dom/client";
import { defineContentScript } from "wxt/utils/define-content-script";
import { appConfig } from "../../config/app";
import { CardRegistry } from "../../content/mount/card-registry";
import { EmbedController } from "../../content/mount/embed-controller";
import { EmbedRoot } from "../../content/mount/EmbedRoot";
import { createOverlayContainer } from "../../content/mount/shadow";
import { watchCards } from "../../content/patreon/card-watcher";
import { watchPatreonTheme } from "../../content/patreon/theme-watcher";
import { hydratePosts } from "../../core/domain/hydrate";
import { request } from "../../core/messaging/client";
import { patreonColorModeItem, postsCacheItem } from "../../core/storage/items";
import { isContextInvalidated } from "../../core/utils/extension-context";
import { useThemeStore } from "../../state/theme.state";



/**
 * @description
 * How long the post cards' loaders wait for the tracked posts, in
 * milliseconds. Posts arriving later still get their panels.
 */
const POSTS_TIMEOUT_MS = 15_000;

export default defineContentScript({
  matches: ["https://www.patreon.com/*"],
  runAt: "document_end",
  main(ctx) {
    // Panels follow Patreon's appearance; the popup follows the last one seen
    const refreshTheme = watchPatreonTheme({
      signal: ctx.signal,
      onChange: (mode, patreonMode) => {
        useThemeStore.getState().setMode(mode);
        patreonColorModeItem.setValue(patreonMode).catch(() => undefined);
      },
    });

    const registry = new CardRegistry();
    const controller = new EmbedController(registry, document, () => window.location.href, appConfig.creatorName);

    // Panels render into their cards through portals, so the root itself
    // never needs to be attached to the page
    // Errors a panel's error boundary catches, it reports itself. Once the
    // extension is reloaded under the page, renders fail until WXT notices
    // and unmounts everything: those are not worth reporting.
    const root = createRoot(document.createElement("div"), {
      onCaughtError: () => undefined,
      onUncaughtError: (error) => {
        if (!isContextInvalidated(error)) {
          reportError(error);
        }
      },
    });
    const overlays = createOverlayContainer();

    root.render(<EmbedRoot registry={registry} overlayContainer={overlays.container} />);

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

    // An unreachable database can leave the first request unanswered rather
    // than failed: the loaders do not wait for it forever
    ctx.setTimeout(() => {
      if (!loaded) {
        controller.setPosts([]);
      }
    }, POSTS_TIMEOUT_MS);

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

    // A moderator's change, made in any tab, refreshes the cached posts
    const unwatchPosts = postsCacheItem.watch(() => loadPosts());

    ctx.onInvalidated(() => {
      unwatchPosts();
      controller.dispose();
      root.unmount();
      overlays.remove();
    });
  },
});
