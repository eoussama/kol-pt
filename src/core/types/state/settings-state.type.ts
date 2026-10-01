import type { TViewMode } from "../../enums/view-mode.enum";



/**
 * @description
 * Interface representing the state of the user settings.
 */
export interface ISettingsState {

  /**
   * @description
   * The view mode of the posts page.
   */
  viewMode: TViewMode;

  /**
   * @description
   * Updates the view mode and saves it for the signed-in user.
   */
  setViewMode: (viewMode: TViewMode) => void;

  /**
   * @description
   * Applies a view mode loaded from the user's settings, without saving it back.
   */
  applyViewMode: (viewMode: TViewMode) => void;
}
