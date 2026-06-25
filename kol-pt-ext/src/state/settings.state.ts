import type { ISettingsState } from "../core/types/state/settings-state.type";
import { create } from "zustand";
import { ViewMode } from "../core/enums/view-mode.enum";
import { SettingsHelper } from "../core/helpers/firebase/repositories/settings.helper";
import { useAuthStore } from "./auth.state";



/**
 * @description
 * State management store for user settings.
 */
export const useSettingsStore = create<ISettingsState>(set => ({

  /**
   * @description
   * The currently active view mode.
   */
  viewMode: ViewMode.Expanded,

  /**
   * @description
   * Updates the view mode.
   *
   * @param viewMode The new view mode.
   */
  setViewMode(viewMode: ViewMode) {
    // Fetching logged in user
    const user = useAuthStore.getState().user;

    // Update view mode
    set({ viewMode });

    // If the user is logged in, update the view mode remotely.
    if (user) {
      SettingsHelper.set<ViewMode>(user.uid, "viewMode", viewMode);
    }
  },
}));
