import type { Imessage } from "../core/types/message.type";

import { defineBackground } from "wxt/utils/define-background";
import { EMessageType } from "../core/enums/message-type.enum";
import { AuthHelper } from "../core/helpers/firebase/auth.helper";
import { PostsHelper } from "../core/helpers/firebase/repositories/posts.helper";
import { MessageHelper } from "../core/helpers/navigator/message.helper";



export default defineBackground(() => {
  MessageHelper.listen(async (e: Imessage, { tab }) => {
    switch (e.type) {
      // If content script is requesting posts
      case EMessageType.LOAD: {
        if (tab?.id) {
          // Answering with no posts on failure, so the page's loaders go away
          const data = await PostsHelper.loadData().catch(() => ({ posts: [], entries: [] }));

          MessageHelper.send(EMessageType.ATTACH, data, tab.id);
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
