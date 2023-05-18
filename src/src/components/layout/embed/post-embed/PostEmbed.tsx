import './../../../../styles/index.scss';

import PostReactions from '../post-reactions/PostReactions';
import { PostProvider } from '../../../../context/PostContext';
import { ReactionOverlayProvider } from '../../../../context/ReactionOverlayContext';
import { IPostEmbedProps } from '../../../../core/types/props/post-embed-props.type';



/**
 * @description
 * A component that embeds a single post.
 * 
 * @param props The component props, containing the post to embed.
 */
function PostEmbed(props: IPostEmbedProps): JSX.Element {
  return <>
    <PostProvider post={props.post}>
      <ReactionOverlayProvider>
        <PostReactions />
      </ReactionOverlayProvider>
    </PostProvider>
  </>
}

export default PostEmbed;