import type { Post } from "../../models/post.model";
import { createRoot } from "react-dom/client";
import PostEmbed from "../../../components/layout/embed/post-embed/PostEmbed";
import PostLoader from "../../../components/layout/embed/post-loader/PostLoader";



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

    createRoot(postWrapper).render(<PostEmbed post={post} />);
    target.after(postWrapper);
  }

  /**
   * @description
   * Injects a post's loader into a target element.
   *
   * @param post The parent post element
   * @param target The HTMLDivElement to inject the post's loader into.
   */
  static postLoader(post: HTMLDivElement, target: HTMLDivElement) {
    const postWrapper = document.createElement("div");

    post.dataset.kol_pt_loader = JSON.stringify(true);
    createRoot(postWrapper).render(<PostLoader />);
    target.after(postWrapper);
  }

  /**
   * @description
   * Gets the target injection element, in order words, the
   * element that's gonna house the injected component
   *
   * @param post - The target post to get the injection element of
   * @returns The target injection HTMLDivElement
   */
  static getInjectionTarget(post: HTMLDivElement): HTMLDivElement {
    return post.querySelector("[data-tag=\"post-content-collapse\"]") ?? post.querySelector("[data-tag=\"post-content\"]") as HTMLDivElement;
  }
}
