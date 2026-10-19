import type { ReactNode } from "react";
import type { CardRegistry } from "./card-registry";

import { useLayoutEffect, useMemo, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import PostEmbed from "../../components/layout/embed/post-embed/PostEmbed";
import PostLoader from "../../components/layout/embed/post-loader/PostLoader";
import UntrackedPost from "../../components/layout/embed/untracked-post/UntrackedPost";
import { ErrorBoundary } from "../../components/layout/generic/error-boundary/ErrorBoundary";
import { PortalContainerProvider } from "../../components/ui/portal-container";
import { TooltipProvider } from "../../components/ui/tooltip";
import { applyThemeClass } from "../../core/theme/color-mode";
import { useAuthSync } from "../../hooks/auth-sync.hook";
import { useProgressSync } from "../../hooks/progress-sync.hook";
import { useReportsSync } from "../../hooks/reports-sync.hook";
import { useWatchlistSync } from "../../hooks/watchlist-sync.hook";
import { useThemeStore } from "../../state/theme.state";
import { PlayerProvider } from "../player/PlayerProvider";
import { getShadowContainer } from "./shadow";



/**
 * @description
 * Embed root props.
 */
interface IEmbedRootProps {
  registry: CardRegistry;

  /**
   * @description
   * Where the panels' overlays render, in a shadow root of their own. Without
   * it they render into the body.
   */
  overlayContainer?: HTMLElement;
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
 * Keeps an element's design tokens in Patreon's appearance.
 *
 * @param element - The element, if any
 */
function useThemedElement(element: HTMLElement | undefined): void {
  const mode = useThemeStore(e => e.mode);

  useLayoutEffect(() => {
    if (element) {
      applyThemeClass(mode, element);
    }
  }, [mode, element]);
}

/**
 * @description
 * Renders a panel into its host's shadow root.
 *
 * @param props - The host, and the panel
 * @param props.host - The element on the page that hosts the panel
 * @param props.children - The panel
 * @returns The portal
 */
function ShadowPortal(props: { host: HTMLElement; children: ReactNode }): ReactNode {
  const container = useMemo(() => getShadowContainer(props.host), [props.host]);

  useThemedElement(container);

  return createPortal(props.children, container);
}

/**
 * @description
 * The single React root of the content script. Each panel is rendered into
 * its card's shadow root through a portal, so all panels share one tree and
 * one teardown, while their styles stay apart from Patreon's.
 *
 * @param props - The registry of the cards to render panels into
 * @returns The panels
 */
export function EmbedRoot(props: IEmbedRootProps): JSX.Element {
  const embeds = useSyncExternalStore(props.registry.subscribe, props.registry.getSnapshot);

  useThemedElement(props.overlayContainer);

  return (
    <PortalContainerProvider container={props.overlayContainer ?? null}>
      <TooltipProvider delay={300}>
        <ErrorBoundary>
          <StateSync />
        </ErrorBoundary>

        {embeds.map(embed => (
          <ShadowPortal key={embed.key} host={embed.host}>
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
            </ErrorBoundary>
          </ShadowPortal>
        ))}
      </TooltipProvider>
    </PortalContainerProvider>
  );
}
