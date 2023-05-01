import { Post } from "../../models/post.model";



/**
 * @description
 * Props of the ReactionMenuProvider component.
 */
export interface IPostProviderProps {

  /**
   * @description
   * The concerning post
   */
  post: Post;

  /**
   * @description
   * Child elements
   */
  children: JSX.Element;
}