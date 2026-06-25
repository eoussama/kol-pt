import type { Post } from "../core/models/post.model";
import type { IPostContext } from "../core/types/context/post-context.type";
import type { IPostProviderProps } from "../core/types/providers/post-provider.props";
import { createContext, useEffect, useState } from "react";



/**
 * @description
 * React context for sharing Post data between components
 */
export const PostContext = createContext<IPostContext>({} as IPostContext);

/**
 * @description
 * React component that provides the Post context to its children.
 *
 * @param props - An object containing props passed down to the provider
 * @returns The Post context provider wrapping its children
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
