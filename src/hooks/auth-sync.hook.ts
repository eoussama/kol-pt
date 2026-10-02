import { useEffect } from "react";
import { authUserItem, moderatorItem } from "../core/storage/items";
import { useAuthStore } from "../state/auth.state";



/**
 * @description
 * Mirrors the signed-in user from extension storage into the auth store.
 * The background writes it whenever Firebase's auth state changes, so every
 * page agrees on who is signed in. Also mirrors whether they are a
 * moderator. Use once per page, at the root.
 */
export function useAuthSync(): void {
  const setUser = useAuthStore(e => e.setUser);
  const setModerator = useAuthStore(e => e.setModerator);
  const uid = useAuthStore(e => e.user?.uid ?? null);

  useEffect(() => {
    let active = true;

    authUserItem.getValue().then((user) => {
      if (active) {
        setUser(user);
      }
    }).catch(() => {
      // Unreadable storage: settle on whatever is known rather than wait forever
      if (active) {
        setUser(useAuthStore.getState().user);
      }
    });

    const unwatch = authUserItem.watch(user => setUser(user));

    return () => {
      active = false;
      unwatch();
    };
  }, [setUser]);

  useEffect(() => {
    let active = true;
    const apply = (value: { uid: string; moderator: boolean } | null) => setModerator(uid !== null && value?.uid === uid && value.moderator);

    moderatorItem.getValue().then((value) => {
      if (active) {
        apply(value);
      }
    }).catch(() => undefined);

    const unwatch = moderatorItem.watch(apply);

    return () => {
      active = false;
      unwatch();
    };
  }, [uid, setModerator]);
}
