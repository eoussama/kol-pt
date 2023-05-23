import { ViewMode } from '../../enums/view-mode.enum';



/**
 * @description
 * Interface representing the state of the user settings.
 */
export interface ISettingsState {

  /**
   * @description
   * The view mode of the posts page.
   */
  viewMode: ViewMode;

  /**
   * @description
   * Updates the view mode.
   */
  setViewMode(viewMode: ViewMode): void;
}
