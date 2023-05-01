import { Post } from "../../models/post.model";
import { ViewMode } from "../../enums/view-mode.enum";



/**
 * @description
 * Interface representing the props for the PostCard component.
 */
export interface IPostCardProps {

  /**
   * @description
   * The Post object to display in the card.
   */
  post: Post;

  /**
   * @description
   * The view mode to display the card in.
   */
  viewMode: ViewMode;
}