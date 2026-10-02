import type { PublicPath } from "wxt/browser";

import { browser } from "wxt/browser";
import { request } from "../core/messaging/client";
import { useAuthStore } from "../state/auth.state";



/**
 * @description
 * The picture shown for users without a profile picture.
 */
const DEFAULT_PHOTO = "./icons/icon128x128.png";

/**
 * @description
 * The size of the login window, fitting the Fireguard card and a status line.
 */
const LOGIN_WINDOW = { width: 500, height: 400 } as const;

/**
 * @description
 * Opens the login window. The toolbar popup closes as soon as it loses
 * focus, so signing in happens in a window of its own. Browsers without
 * windows (Firefox for Android, Safari on iOS) get a tab instead.
 *
 * @returns Promise that resolves once the window or tab is open
 */
async function openLoginWindow(): Promise<void> {
  const url = browser.runtime.getURL("/auth.html" as PublicPath);

  try {
    await browser.windows.create({ url, type: "popup", focused: true, ...LOGIN_WINDOW });
  }
  catch {
    await browser.tabs.create({ url });
  }
}

/**
 * @description
 * Handles user authentication
 *
 * @returns Auth state and handlers
 */
export function useAuth() {
  const user = useAuthStore(e => e.user);

  const isLoggedIn = () => Boolean(user);

  /**
   * @description
   * Opens the login window.
   */
  const onLogin = () => {
    openLoginWindow().catch(() => undefined);
  };

  /**
   * @description
   * Signs out
   */
  const onLogout = () => {
    request("auth.signOut", {}).catch(() => undefined);
  };

  return {
    email: user?.email ?? "",
    photo: user?.photoURL ?? DEFAULT_PHOTO,
    onLogin,
    onLogout,
    isLoggedIn,
  };
}
