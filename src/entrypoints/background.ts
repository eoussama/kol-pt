import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";
import { watchAuthState } from "../background/auth";
import { handlers } from "../background/handlers";
import { serve } from "../background/messaging/server";
import { clearProgress, loadProgress } from "../background/repositories/progress";
import { clearWatchlist, favorites, loadWatchlist } from "../background/repositories/watchlist";
import { LEGACY_STORAGE_KEYS } from "../core/storage/items";



export default defineBackground(() => {
  // Both must be registered synchronously, every time the background starts.
  // The server first: watching auth throws if the build lacks Firebase settings.
  serve(handlers);

  try {
    watchAuthState((user) => {
      for (const list of [undefined, favorites]) {
        (user ? loadWatchlist(user.uid, list) : clearWatchlist(list)).catch(() => undefined);
      }

      (user ? loadProgress(user.uid) : clearProgress()).catch(() => undefined);
    });
  }
  catch (error) {
    console.error("[KOL PT] Sign-in is unavailable:", error);
  }

  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === "update") {
      browser.storage.local.remove([...LEGACY_STORAGE_KEYS]).catch(() => undefined);
    }
  });
});
