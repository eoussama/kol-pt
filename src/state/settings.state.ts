import type { TViewMode } from "../core/enums/view-mode.enum";
import type { ISettingsState } from "../core/types/state/settings-state.type";
import { create } from "zustand";
import { EViewMode } from "../core/enums/view-mode.enum";
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
  viewMode: EViewMode.EXPANDED,

  /**
   * @description
   * Updates the view mode.
   *
   * @param viewMode The new view mode.
   */
  setViewMode(viewMode: TViewMode) {
    // Fetching logged in user
    const user = useAuthStore.getState().user;

    // Update view mode
    set({ viewMode });

    // If the user is logged in, update the view mode remotely.
    if (user) {
      SettingsHelper.set<TViewMode>(user.uid, "viewMode", viewMode);
    }
  },
}));
