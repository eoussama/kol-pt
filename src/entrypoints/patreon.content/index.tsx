import type { TEntry } from "../../core/schemas/entry/entry.schema";
import type { TPost } from "../../core/schemas/post.schema";

import { createRoot } from "react-dom/client";
import { defineContentScript } from "wxt/utils/define-content-script";
import { CardRegistry } from "../../content/mount/card-registry";
import { EmbedController } from "../../content/mount/embed-controller";
import { EmbedRoot } from "../../content/mount/EmbedRoot";
import { watchCards } from "../../content/patreon/card-watcher";
import { hydratePosts } from "../../core/domain/hydrate";
import { EMessageType } from "../../core/enums/message-type.enum";
import { MessageHelper } from "../../core/helpers/navigator/message.helper";



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

    // Tracked posts and their entries arrive from the background as plain data
    const stopListening = MessageHelper.listen<{ posts: Array<TPost>; entries: Array<TEntry> }>((e) => {
      controller.setPosts(hydratePosts(e.payload?.posts ?? [], e.payload?.entries ?? []));
    }, EMessageType.ATTACH);

    MessageHelper.send(EMessageType.LOAD);

    // Cards appear after load, on infinite scroll and on client-side navigation
    watchCards({ signal: ctx.signal, onChange: () => controller.sync() });
    ctx.addEventListener(window, "wxt:locationchange", () => controller.sync());

    ctx.onInvalidated(() => {
      stopListening();
      controller.dispose();
      root.unmount();
    });
  },
});
