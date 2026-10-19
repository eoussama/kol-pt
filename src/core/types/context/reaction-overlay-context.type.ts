import type { TUnsafe } from "@eoussama/core";
import type { Tag } from "../../domain/tag";



/**
 * @description
 * Represents the state of the reaction details dialog. Each reaction has its
 * own menu, so only the dialog is shared by a post's reactions.
 */

export interface IReactionOverlayContext {

  /**
   * @description
   * Whether the dialog is opened or not.
   */
  dialogOpened: boolean;

  /**
   * @description
   * The selected tag to show
   */
  tag: TUnsafe<Tag>;

  /**
   * @description
   * A function that updates the `dialogOpened` state property.
   */
  setDialogOpened: React.Dispatch<React.SetStateAction<boolean>>;

  /**
   * @description
   * A function that updates the `selectedTag` state property.
   */
  setTag: React.Dispatch<React.SetStateAction<TUnsafe<Tag>>>;
}
