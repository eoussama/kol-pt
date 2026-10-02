import { useEffect } from "react";
import { reportsItem } from "../core/storage/items";
import { useAuthStore } from "../state/auth.state";
import { useReportsStore } from "../state/reports.state";



/**
 * @description
 * Mirrors the open reports from extension storage into their store, for
 * moderators, so a report closed in one tab disappears in every tab. Use
 * once per page, at the root.
 */
export function useReportsSync(): void {
  const uid = useAuthStore(e => e.user?.uid ?? null);
  const moderator = useAuthStore(e => e.moderator);
  const setReports = useReportsStore(e => e.setReports);

  useEffect(() => {
    if (!uid || !moderator) {
      setReports([]);

      return undefined;
    }

    let active = true;
    const apply = (value: { uid: string; reports: Parameters<typeof setReports>[0] } | null) => setReports(value?.uid === uid ? value.reports : []);

    reportsItem.getValue().then((value) => {
      if (active) {
        apply(value);
      }
    }).catch(() => undefined);

    const unwatch = reportsItem.watch(apply);

    return () => {
      active = false;
      unwatch();
    };
  }, [uid, moderator, setReports]);
}
