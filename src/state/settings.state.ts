import type { TViewMode } from "../core/enums/view-mode.enum";
import type { ISettingsState } from "../core/types/state/settings-state.type";

import { create } from "zustand";
import { EViewMode } from "../core/enums/view-mode.enum";
import { request } from "../core/messaging/client";
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
   * Updates the view mode, and saves it for the signed-in user.
   *
   * @param viewMode The new view mode.
   */
  setViewMode(viewMode: TViewMode) {
    set({ viewMode });

    if (useAuthStore.getState().user) {
      request("settings.set", { settings: { viewMode } }).catch(() => undefined);
    }
  },

  /**
   * @description
   * Applies a view mode loaded from the user's settings.
   *
   * @param viewMode The loaded view mode.
   */
  applyViewMode(viewMode: TViewMode) {
    set({ viewMode });
  },
}));
