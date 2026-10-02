import type { CardRegistry } from "./card-registry";

import { CacheProvider } from "@emotion/react";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import PostEmbed from "../../components/layout/embed/post-embed/PostEmbed";
import PostLoader from "../../components/layout/embed/post-loader/PostLoader";
import UntrackedPost from "../../components/layout/embed/untracked-post/UntrackedPost";
import { ErrorBoundary } from "../../components/layout/generic/error-boundary/ErrorBoundary";
import { ThemeRoot } from "../../components/theme/ThemeRoot";
import { useAuthSync } from "../../hooks/auth-sync.hook";
import { useProgressSync } from "../../hooks/progress-sync.hook";
import { useReportsSync } from "../../hooks/reports-sync.hook";
import { useWatchlistSync } from "../../hooks/watchlist-sync.hook";
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
 * Mirrors the signed-in user, their watchlist, saved positions and, for
 * moderators, the open reports. A component of its own so
 * that, inside its error boundary, a failure here cannot take the panels down.
 *
 * @returns Nothing
 */
function StateSync(): null {
  useAuthSync();
  useWatchlistSync();
  useProgressSync();
  useReportsSync();

  return null;
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

  return (
    <CacheProvider value={emotionCache}>
      <ThemeRoot>
        <ErrorBoundary>
          <StateSync />
        </ErrorBoundary>

        {embeds.map(embed => createPortal(
          <ErrorBoundary>
            {embed.post
              ? (
                  <PlayerProvider card={embed.card} postId={embed.postId}>
                    <PostEmbed post={embed.post} />
                  </PlayerProvider>
                )
              : embed.untracked
                ? <UntrackedPost card={embed.card} postId={embed.postId} />
                : <PostLoader />}
          </ErrorBoundary>,
          embed.host,
          embed.key,
        ))}
      </ThemeRoot>
    </CacheProvider>
  );
}
