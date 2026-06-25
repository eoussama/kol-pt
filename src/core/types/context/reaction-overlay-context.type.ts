import type { TUnsafe } from "@eoussama/core";
import type { Tag } from "../../models/tag.model";



/**
 * @description
 * Represents the state of the reaction overlays (menu, dialog) components in the application.
 */

export interface IReactionOverlayContext {

  /**
   * @description
   * Whether the anchor for the menu is opened or not.
   */
  anchorOpened: boolean;

  /**
   * @description
   * Whether the dialog is opened or not.
   */
  dialogOpened: boolean;

  /**
   * @description
   * The element that serves as the anchor for the menu.
   */
  anchorEl: TUnsafe<HTMLElement>;

  /**
   * @description
   * The selected tag to show
   */
  tag: TUnsafe<Tag>;

  /**
   * @description
   * A function that updates the `anchorOpened` state property.
   */
  setAnchorOpened: React.Dispatch<React.SetStateAction<boolean>>;

  /**
   * @description
   * A function that updates the `dialogOpened` state property.
   */
  setDialogOpened: React.Dispatch<React.SetStateAction<boolean>>;

  /**
   * @description
   * A function that updates the `anchorEl` state property.
   */
  setAnchorEl: React.Dispatch<React.SetStateAction<TUnsafe<HTMLElement>>>;

  /**
   * @description
   * A function that updates the `selectedTag` state property.
   */
  setTag: React.Dispatch<React.SetStateAction<TUnsafe<Tag>>>;
}
