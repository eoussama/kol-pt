import { Post } from "../core/models/post.model";
import { createContext, useEffect, useState } from "react";
import { IPostContext } from "../core/types/context/post-context.type";
import { IPostProviderProps } from "../core/types/providers/post-provider.props";



/**
 * @description
 * React context for sharing Post data between components
 */
export const PostContext = createContext<IPostContext>({} as any);

/**
 * @description
 * React component that provides the Post context to its children.
 *
 * @param props An object containing props passed down to the provider.
 */
export function PostProvider(props: IPostProviderProps): JSX.Element {
  const [post, setPost] = useState<Post>(props.post);

  useEffect(() => {
    setPost(props.post);
  }, [props.post]);

  return (
    <PostContext.Provider value={{ post }}>
      {props.children}
    </PostContext.Provider>
  );
}