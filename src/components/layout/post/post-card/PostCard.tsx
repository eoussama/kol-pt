import type { IPostCardProps } from "../../../../core/types/props/post-card-props.type";

import { useLayoutEffect, useRef, useState } from "react";
import { ModerationProvider } from "../../../../context/ModerationContext";
import { EViewMode } from "../../../../core/enums/view-mode.enum";
import { cn } from "../../../../core/utils/cn";
import { openPost } from "../../../../core/utils/links";
import { useAuthStore } from "../../../../state/auth.state";
import { badgeVariants } from "../../../ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip";
import PostModerationMenu from "../../moderation/PostModerationMenu";



/**
 * @description
 * Renders a card for displaying a post, with an image, title, date, description and tags.
 * Moderators also get the post's moderation menu in its corner.
 *
 * @param props - The post card props
 * @returns The rendered post card
 */
function PostCard(props: IPostCardProps): JSX.Element {
  const { post } = props;
  const { viewMode } = props;

  const moderator = useAuthStore(e => e.moderator);
  const compact = viewMode === EViewMode.COMPACT;
  const chipsRef = useRef<HTMLDivElement>(null);
  const [chipsOpen, setChipsOpen] = useState(false);
  const [chipsOverflow, setChipsOverflow] = useState(false);

  // Expanded cards show one row of chips; whether more wrap below it decides
  // if the toggle shows. Measured while collapsed, and again on resize.
  useLayoutEffect(() => {
    const chips = chipsRef.current;

    if (compact || !chips || chipsOpen) {
      return;
    }

    const measure = () => setChipsOverflow(chips.scrollHeight > chips.clientHeight + 1);
    const observer = new ResizeObserver(measure);

    measure();
    observer.observe(chips);

    return () => observer.disconnect();
  }, [compact, chipsOpen, post.tags.length]);

  /**
   * @description
   * Opens the post in a new window when the card is clicked.
   */
  const goToPost = () => {
    openPost(post.id);
  };

  /**
   * @description
   * Opens the post in a new window and plays specific reaction
   *
   * @param e The mouse click event
   * @param reactionId The id of the reaction
   */
  const goToReaction = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, reactionId: string) => {
    e.stopPropagation();
    e.preventDefault();

    openPost(post.id, reactionId);
  };

  return (
    <article
      data-view-mode={compact ? "compact" : "expanded"}
      className={cn(
        "group/card relative overflow-hidden rounded-xl border bg-card text-card-foreground transition-colors hover:bg-muted/40 has-[[data-slot=post-open]:focus-visible]:ring-3 has-[[data-slot=post-open]:focus-visible]:ring-ring/50",
        compact ? "flex gap-3 p-2" : "flex flex-col",
      )}
    >
      <div
        className={cn(
          "shrink-0 overflow-hidden bg-muted",
          compact ? "aspect-video w-24 self-start rounded-lg" : "aspect-2/1 w-full",
        )}
      >
        <img
          alt={post.title}
          loading="lazy"
          src={post.thumbnail}
          className="size-full object-cover transition-transform duration-500 ease-out group-hover/card:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover/card:scale-100"
        />
      </div>

      <div className={cn("flex min-w-0 flex-1 flex-col", compact ? "gap-1" : "gap-1.5 p-3")}>
        <div className="flex min-w-0 flex-col gap-0.5">
          {/* The whole card opens the post, through this button stretched over it */}
          <button
            type="button"
            data-slot="post-open"
            onClick={goToPost}
            className={cn(
              "text-left font-semibold leading-snug outline-none after:absolute after:inset-0 after:content-['']",
              compact ? "truncate text-sm" : "line-clamp-2 text-[0.9375rem]",
              compact && moderator && "pr-8",
            )}
          >
            {post.title}
          </button>

          <time
            dateTime={post.creationDate.toISOString()}
            className="text-xs text-muted-foreground tabular-nums"
          >
            {post.creationDate.toLocaleString()}
          </time>
        </div>

        {!compact && post.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {post.description}
          </p>
        )}

        {post.tags.length > 0 && (
          <div
            ref={chipsRef}
            className={cn(
              "relative z-10 flex w-fit max-w-full gap-1",
              compact ? "overflow-x-auto [scrollbar-width:none]" : "mt-0.5 flex-wrap",
              !compact && !chipsOpen && "max-h-5 overflow-hidden",
            )}
          >
            {post.tags.map(tag => (
              <Tooltip key={tag.id}>
                <TooltipTrigger
                  render={(
                    <button
                      type="button"
                      onClick={e => goToReaction(e, tag.id)}
                      className={cn(badgeVariants({ variant: "outline" }), "cursor-pointer bg-background hover:bg-muted")}
                    />
                  )}
                >
                  {tag.getShortTitle()}
                </TooltipTrigger>
                <TooltipContent>{tag.getHoverText()}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}

        {!compact && (chipsOverflow || chipsOpen) && (
          <button
            type="button"
            aria-expanded={chipsOpen}
            onClick={() => setChipsOpen(!chipsOpen)}
            className="relative z-10 w-fit cursor-pointer rounded-sm text-xs font-medium text-muted-foreground underline-offset-2 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {chipsOpen ? "Show less" : "Show more"}
          </button>
        )}
      </div>

      {moderator && (
        <div className={cn("absolute z-10", compact ? "top-1.5 right-1.5" : "top-2 right-2")}>
          <ModerationProvider post={post}>
            <PostModerationMenu
              post={post}
              listReactions={true}
              className={cn(!compact && "rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-sm hover:bg-background")}
            />
          </ModerationProvider>
        </div>
      )}
    </article>
  );
}

export default PostCard;
