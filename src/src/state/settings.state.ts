import { create } from 'zustand';
import { ViewMode } from '../core/enums/view-mode.enum';
import { ISettingsState } from '../core/types/state/settings-state.type';



/**
 * @description
 * State management store for user settings.
 */
export const useSettingsStore = create<ISettingsState>((set) => ({

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
    set({ viewMode });

    // https://kol-patreon-tracker-default-rtdb.firebaseio.com/users/X2dyrjIAf2TfJB5YQavwbZMRo6n1/viewMode
  }
}));