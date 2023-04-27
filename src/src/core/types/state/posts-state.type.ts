import { Post } from "../../models/post.model";



export interface IPostsState {
  loading: boolean;
  posts: Array<Post>;

  clearCache: () => void;
  loadPosts: (cache?: boolean) => void
}