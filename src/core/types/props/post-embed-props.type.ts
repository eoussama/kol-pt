import type { Post } from "../../domain/post";



/**
 * @description
 * Props for rendering a Patreon post as an embedded media object.
 */
export interface IPostEmbedProps {

  /**
   * @description
   * The Patreon post to render.
   */
  post: Post;
}
