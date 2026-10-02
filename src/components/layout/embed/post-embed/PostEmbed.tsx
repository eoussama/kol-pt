import type { IPostEmbedProps } from "../../../../core/types/props/post-embed-props.type";

import { ModerationProvider } from "../../../../context/ModerationContext";
import { PostProvider } from "../../../../context/PostContext";
import { ReactionOverlayProvider } from "../../../../context/ReactionOverlayContext";
import PostReactions from "../post-reactions/PostReactions";

import "./../../../../styles/embed.scss";



/**
 * @description
 * A component that embeds a single post.
 *
 * @param props - The component props, containing the post to embed
 * @returns The rendered post embed
 */
function PostEmbed(props: IPostEmbedProps): JSX.Element {
  return (
    <PostProvider post={props.post}>
      <ReactionOverlayProvider>
        <ModerationProvider post={props.post}>
          <PostReactions />
        </ModerationProvider>
      </ReactionOverlayProvider>
    </PostProvider>
  );
}

export default PostEmbed;
