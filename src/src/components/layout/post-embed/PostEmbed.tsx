import PostReactions from "../post-reactions/PostReactions";
import { PostProvider } from "../../../context/PostContext";
import { ReactionMenuProvider } from "../../../context/ReactionMenuContext";
import { IPostEmbedProps } from "../../../core/types/props/post-embed-props.type";



/**
 * @description
 * A component that embeds a single post.
 * 
 * @param props The component props, containing the post to embed.
 */
function PostEmbed(props: IPostEmbedProps): JSX.Element {
  return <>
    <PostProvider post={props.post}>
      <ReactionMenuProvider>
        <PostReactions />
      </ReactionMenuProvider>
    </PostProvider>
  </>
}

export default PostEmbed;