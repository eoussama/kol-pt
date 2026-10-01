import type { Post } from "../../domain/post";



/**
 * @description
 * Context interface for holding a single post object.
 */
export interface IPostContext {

  /**
   * @description
   * The post object being held in the context.
   */
  post: Post;
}
