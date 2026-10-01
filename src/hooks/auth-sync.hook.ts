import { useEffect } from "react";
import { authUserItem } from "../core/storage/items";
import { useAuthStore } from "../state/auth.state";



/**
 * @description
 * Mirrors the signed-in user from extension storage into the auth store.
 * The background writes it whenever Firebase's auth state changes, so every
 * page agrees on who is signed in. Use once per page, at the root.
 */
export function useAuthSync(): void {
  const setUser = useAuthStore(e => e.setUser);

  useEffect(() => {
    let active = true;

    authUserItem.getValue().then((user) => {
      if (active) {
        setUser(user);
      }
    }).catch(() => undefined);

    const unwatch = authUserItem.watch(user => setUser(user));

    return () => {
      active = false;
      unwatch();
    };
  }, [setUser]);
}
