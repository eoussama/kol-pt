import { FiremittHelper } from "@eoussama/firemitt";
import { getFiremittOptions } from "../core/auth/fireguard";
import { request } from "../core/messaging/client";
import { useAuthStore } from "../state/auth.state";



/**
 * @description
 * The picture shown for users without a profile picture.
 */
const DEFAULT_PHOTO = "./icons/icon128x128.png";

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
   * Signs in with Google through Fireguard, then hands the token to the
   * background, which owns the Firebase session.
   */
  const onLogin = () => {
    FiremittHelper.auth({ ...getFiremittOptions(), mode: "popup", pos: { y: 50, x: Math.round(window.screen.width / 2 - 225) } })
      .then(idToken => request("auth.signIn", { idToken }))
      .catch(() => undefined);
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
