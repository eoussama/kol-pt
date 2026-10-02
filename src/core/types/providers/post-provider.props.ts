import type { Post } from "../../domain/post";



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
