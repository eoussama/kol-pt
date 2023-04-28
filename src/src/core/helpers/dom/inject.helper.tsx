import ReactDOM from "react-dom";
import PostDetail from "../../../components/layout/post-detail/PostDetail";
import { Post } from "../../models/post.model";



export class InjectHelper {

  static postDetail(post: Post, target: HTMLDivElement) {
    const postWrapper = document.createElement("div");

    ReactDOM.render(<PostDetail post={post} />, postWrapper);
    target.after(postWrapper);
  }
}