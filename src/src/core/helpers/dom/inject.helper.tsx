import ReactDOM from "react-dom";
import { Post } from "../../models/post.model";
import PostEmbed from "../../../components/layout/post-embed/PostEmbed";
import PostLoader from "../../../components/layout/post-loader/PostLoader";



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

  /**
   * @description
   * Injects a post's loader into a target element.
   * 
   * @param target The HTMLDivElement to inject the post's loader into.
   */
  static postLoader(target: HTMLDivElement) {
    const postWrapper = document.createElement("div");

    postWrapper.dataset['kol_pt_loader'] = JSON.stringify(true);
    ReactDOM.render(<PostLoader />, postWrapper);
    target.after(postWrapper);
  }

  /**
   * @description
   * Gets the target injection element, in order words, the
   * element that's gonna house the injected component
   *
   * @param post The target post to get the injection element of
   */
  static getInjectionTarget(post: HTMLDivElement): HTMLDivElement {
    return post.querySelector('[data-tag="post-content-collapse"]') ?? post.querySelector('[data-tag="post-content"]') as HTMLDivElement;
  }
}