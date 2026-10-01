import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";
import { watchAuthState } from "../background/auth";
import { handlers } from "../background/handlers";
import { serve } from "../background/messaging/server";
import { LEGACY_STORAGE_KEYS } from "../core/storage/items";



export default defineBackground(() => {
  // Both must be registered synchronously, every time the background starts
  watchAuthState();
  serve(handlers);

  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === "update") {
      browser.storage.local.remove([...LEGACY_STORAGE_KEYS]).catch(() => undefined);
    }
  });
});
