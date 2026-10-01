import { useEffect } from "react";
import { EViewMode } from "../core/enums/view-mode.enum";
import { request } from "../core/messaging/client";
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
  const applyViewMode = useSettingsStore(e => e.applyViewMode);

  const compactViewColor: "primary" | "default" = viewMode === EViewMode.COMPACT ? "primary" : "default";
  const expandedViewColor: "primary" | "default" = viewMode === EViewMode.EXPANDED ? "primary" : "default";

  useEffect(() => {
    if (user) {
      request("settings.get", {})
        .then(settings => applyViewMode(settings.viewMode))
        .catch(() => undefined);
    }
  }, [user?.uid]);

  return { viewMode, compactViewColor, expandedViewColor, setViewMode };
}
