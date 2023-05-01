import ReactDOM from "react-dom";
import { Post } from "../../models/post.model";
import PostEmbed from "../../../components/layout/post-embed/PostEmbed";



/**
 * @description
 * A helper class for injecting content into the DOM.
 */
export class InjectHelper {

  /**
   * @description
   * Injects a post's details into a target element.
   * 
   * @param post The post to inject.
   * @param target The HTMLDivElement to inject the post's details into.
   */
  static postDetail(post: Post, target: HTMLDivElement) {
    const postWrapper = document.createElement("div");

    ReactDOM.render(<PostEmbed post={post} />, postWrapper);
    target.after(postWrapper);
  }
}