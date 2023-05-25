import './../../../../styles/index.scss';

import { useEffect } from 'react';
import { useAuthStore } from '../../../../state/auth.state';
import PostReactions from '../post-reactions/PostReactions';
import { PostProvider } from '../../../../context/PostContext';
import { Imessage } from '../../../../core/types/message.type';
import { MessageType } from '../../../../core/enums/message-type.enum';
import { MessageHelper } from '../../../../core/helpers/navigator/message.helper';
import { ReactionOverlayProvider } from '../../../../context/ReactionOverlayContext';
import { IPostEmbedProps } from '../../../../core/types/props/post-embed-props.type';



/**
 * @description
 * A component that embeds a single post.
 * 
 * @param props The component props, containing the post to embed.
 */
function PostEmbed(props: IPostEmbedProps): JSX.Element {
  const login = useAuthStore(e => e.login);
  const logout = useAuthStore(e => e.logout);

  useEffect(() => {
    MessageHelper.send(MessageType.SyncRequest);
    MessageHelper.listen(async (e: Imessage) => {
      if (e.payload) {
        login(e.payload);
      } else {
        logout();
      }
    }, MessageType.SyncResponse);
  }, []);

  return <>
    <PostProvider post={props.post}>
      <ReactionOverlayProvider>
        <PostReactions />
      </ReactionOverlayProvider>
    </PostProvider>
  </>
}

export default PostEmbed;