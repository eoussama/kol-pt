import type { User } from "firebase/auth";
import type { Imessage } from "../../core/types/message.type";
import type { CardRegistry } from "./card-registry";

import { CacheProvider } from "@emotion/react";
import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import PostEmbed from "../../components/layout/embed/post-embed/PostEmbed";
import PostLoader from "../../components/layout/embed/post-loader/PostLoader";
import { ErrorBoundary } from "../../components/layout/generic/error-boundary/ErrorBoundary";
import { EMessageType } from "../../core/enums/message-type.enum";
import { MessageHelper } from "../../core/helpers/navigator/message.helper";
import { useAuthStore } from "../../state/auth.state";
import { PlayerProvider } from "../player/PlayerProvider";
import { emotionCache } from "./emotion-cache";



/**
 * @description
 * Embed root props.
 */
interface IEmbedRootProps {
  registry: CardRegistry;
}

/**
 * @description
 * Keeps the signed-in user in sync with the background, once per page.
 */
function useAuthSync(): void {
  const login = useAuthStore(e => e.login);
  const logout = useAuthStore(e => e.logout);

  useEffect(() => {
    const unsubscribe = MessageHelper.listen<User>((e: Imessage<User>) => {
      if (e.payload) {
        login(e.payload);
      }
      else {
        logout();
      }
    }, EMessageType.SYNC_RESPONSE);

    MessageHelper.send(EMessageType.SYNC_REQUEST);

    return unsubscribe;
  }, [login, logout]);
}

/**
 * @description
 * The single React root of the content script. Each panel is rendered into
 * its card through a portal, so all panels share one tree, one style cache
 * and one teardown.
 *
 * @param props - The registry of mounted panels
 * @returns The panels
 */
export function EmbedRoot(props: IEmbedRootProps): JSX.Element {
  const embeds = useSyncExternalStore(props.registry.subscribe, props.registry.getSnapshot);

  useAuthSync();

  return (
    <CacheProvider value={emotionCache}>
      {embeds.map(embed => createPortal(
        <ErrorBoundary>
          {embed.post
            ? (
                <PlayerProvider card={embed.card} postId={embed.postId}>
                  <PostEmbed post={embed.post} />
                </PlayerProvider>
              )
            : <PostLoader />}
        </ErrorBoundary>,
        embed.host,
        embed.key,
      ))}
    </CacheProvider>
  );
}
