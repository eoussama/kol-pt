import { useEffect } from "react";
import { EViewMode } from "../core/enums/view-mode.enum";
import { SettingsHelper } from "../core/helpers/firebase/repositories/settings.helper";
import { useAuthStore } from "../state/auth.state";
import { useSettingsStore } from "../state/settings.state";



/**
 * @description
 * Manages view mode.
 *
 * @returns View mode state and color indicators
 */
export function useViewMode() {
  const user = useAuthStore(e => e.user);
  const viewMode = useSettingsStore(e => e.viewMode);
  const setViewMode = useSettingsStore(e => e.setViewMode);

  const compactViewColor: "primary" | "default" = viewMode === EViewMode.COMPACT ? "primary" : "default";
  const expandedViewColor: "primary" | "default" = viewMode === EViewMode.EXPANDED ? "primary" : "default";

  useEffect(() => {
    if (user) {
      SettingsHelper
        .get(user.uid, "viewMode")
        .then((userViewMode) => {
          setViewMode(userViewMode);
        });
    }
  }, [user?.uid]);

  return { viewMode, compactViewColor, expandedViewColor, setViewMode };
}
