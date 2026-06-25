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
   * Updates the view mode.
   */
  setViewMode: (viewMode: TViewMode) => void;
}
