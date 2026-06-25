import type { User } from "firebase/auth";
import type { Imessage } from "../../../../core/types/message.type";
import type { IPostEmbedProps } from "../../../../core/types/props/post-embed-props.type";
import { useEffect } from "react";
import { PostProvider } from "../../../../context/PostContext";
import { ReactionOverlayProvider } from "../../../../context/ReactionOverlayContext";
import { MessageType } from "../../../../core/enums/message-type.enum";
import { MessageHelper } from "../../../../core/helpers/navigator/message.helper";
import { useAuthStore } from "../../../../state/auth.state";
import PostReactions from "../post-reactions/PostReactions";
import "./../../../../styles/index.scss";



/**
 * @description
 * A component that embeds a single post.
 *
 * @param props - The component props, containing the post to embed
 * @returns The rendered post embed
 */
function PostEmbed(props: IPostEmbedProps): JSX.Element {
  const login = useAuthStore(e => e.login);
  const logout = useAuthStore(e => e.logout);

  useEffect(() => {
    MessageHelper.send(MessageType.SyncRequest);
    MessageHelper.listen<User>(async (e: Imessage<User>) => {
      if (e.payload) {
        login(e.payload);
      }
      else {
        logout();
      }
    }, MessageType.SyncResponse);
  }, []);

  return (
    <>
      <PostProvider post={props.post}>
        <ReactionOverlayProvider>
          <PostReactions />
        </ReactionOverlayProvider>
      </PostProvider>
    </>
  );
}

export default PostEmbed;
