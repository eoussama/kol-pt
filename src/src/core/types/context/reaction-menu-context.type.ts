import { Nullable } from "../nullable.type";
import { Tag } from "../../models/tag.model";



/**
 * @description
 * Represents the state of the reaction menu component in the application.
 */

export interface IReactionMenuContext {

  /**
   * @description
   * Whether the anchor for the menu is opened or not.
   */
  anchorOpened: boolean;

  /**
   * @description
   * The element that serves as the anchor for the menu.
   */
  anchorEl: Nullable<HTMLElement>;

  /**
   * @description
   * The selected tag to show
   */
  tag: Nullable<Tag>;

  /**
   * @description
   * A function that updates the `anchorOpened` state property.
   */
  setAnchorOpened: React.Dispatch<React.SetStateAction<boolean>>;

  /**
   * @description
   * A function that updates the `anchorEl` state property.
   */
  setAnchorEl: React.Dispatch<React.SetStateAction<Nullable<HTMLElement>>>;

  /**
   * @description
   * A function that updates the `selectedTag` state property.
   */
  setTag: React.Dispatch<React.SetStateAction<Nullable<Tag>>>;
}