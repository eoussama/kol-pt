import type { Imessage } from "../core/types/message.type";

import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";
import { EMessageType } from "../core/enums/message-type.enum";
import { AuthHelper } from "../core/helpers/firebase/auth.helper";
import { PostsHelper } from "../core/helpers/firebase/repositories/posts.helper";
import { MessageHelper } from "../core/helpers/navigator/message.helper";
import { URLHelper } from "../core/helpers/parse/url.helper";



export default defineBackground(() => {
  // On update
  browser.webNavigation.onCompleted.addListener(async ({ tabId, url }) => {
    // On patreon page update
    if (URLHelper.isPatreon(url ?? "")) {
      // Sending initialization message to content
      MessageHelper.send(EMessageType.INIT, null, tabId);
    }
  });

  // On load message received
  MessageHelper.listen(async (e: Imessage, { tab }) => {
    switch (e.type) {
      // If content script is requesting posts
      case EMessageType.LOAD: {
        if (tab?.id) {
          // Fetching the posts
          const posts = await PostsHelper.load();

          // Forwarding the fetched posts over to active page
          MessageHelper.send(EMessageType.ATTACH, { posts }, tab.id);
        }

        break;
      }

      // If state request is due
      case EMessageType.SYNC_REQUEST: {
        if (tab?.id) {
          AuthHelper.onChange(user => MessageHelper.send(EMessageType.SYNC_RESPONSE, user, tab.id));
        }

        break;
      }

      // If image fetching is requested
      case EMessageType.FETCH_IMAGE: {
        if (tab?.id) {
          const url = (e as Imessage<{ url: string }>).payload?.url ?? "";

          try {
            const response = await fetch(url);
            const buffer = await response.arrayBuffer();
            const mime = response.headers.get("content-type") ?? "image/jpeg";
            const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
            const dataUrl = `data:${mime};base64,${base64}`;

            MessageHelper.send(EMessageType.FETCH_IMAGE_RESPONSE, { dataUrl }, tab.id);
          }
          catch {
            MessageHelper.send(EMessageType.FETCH_IMAGE_RESPONSE, { dataUrl: null }, tab.id);
          }
        }

        break;
      }
    }
  });
});
