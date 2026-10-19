import type { Tag } from "../../../../core/domain/tag";
import type { IPostReactionProps } from "../../../../core/types/props/post-reaction-props.type";

import { Flag, Heart, Info, Play, RotateCcw } from "lucide-react";
import { useContext } from "react";
import { usePlayer } from "../../../../content/player/PlayerProvider";
import { useModeration } from "../../../../context/ModerationContext";
import { PostContext } from "../../../../context/PostContext";
import { ReactionOverlayContext } from "../../../../context/ReactionOverlayContext";
import { cn } from "../../../../core/utils/cn";
import { useAuthStore } from "../../../../state/auth.state";
import { useFavoritesStore, usePostFavorites } from "../../../../state/favorites.state";
import { selectReports, useReportsStore } from "../../../../state/reports.state";
import { usePostWatchlist, useWatchlistStore } from "../../../../state/watchlist.state";
import { Badge } from "../../../ui/badge";
import { Button } from "../../../ui/button";
import { Checkbox } from "../../../ui/checkbox";
import { Spinner } from "../../../ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip";
import PostReactionMenu from "../post-reaction-menu/PostReactionMenu";



/**
 * @description
 * The actions that appear on hover, and on keyboard focus.
 */
const REVEAL = "opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100";

/**
 * @description
 * A React component that renders a single post reaction with skip and more buttons.
 *
 * @param props - The props object containing the necessary properties to render the component
 * @returns The rendered post reaction item
 */
function PostReaction(props: IPostReactionProps): JSX.Element {
  const { tag } = props;
  const user = useAuthStore(e => e.user);
  const { post } = useContext(PostContext);
  const { isWatched, saving, isSaving } = usePostWatchlist(post.id);
  const watched = isWatched(tag.id);
  const savingThis = isSaving(tag.id);
  const favorites = usePostFavorites(post.id);
  const favorite = favorites.isFavorite(tag.id);
  const toggleFavorite = useFavoritesStore(e => e.toggle);
  const toggleWatched = useWatchlistStore(e => e.toggle);
  const { playing, currentTime, playFrom } = usePlayer();
  const { setTag, setDialogOpened } = useContext(ReactionOverlayContext);
  const moderator = useAuthStore(e => e.moderator);
  const allReports = useReportsStore(e => e.reports);
  const reports = moderator ? selectReports(allReports, post.id, tag.id) : [];
  const { review } = useModeration();

  // Signed-in viewers can always report, so the menu is there for them
  const hasMore = Boolean(tag.entry) || Boolean(user);

  /**
   * @description
   * Checks if user is logged in
   *
   * @returns True if user is authenticated
   */
  const isLoggedIn = () => {
    return Boolean(user);
  };

  /**
   * @description
   * Checks whether the associated reaction is currently being played
   *
   * @returns True if the reaction is currently playing
   */
  const isPlaying = () => {
    return currentTime > 0 && tag.startTime <= currentTime && currentTime <= tag.endTime;
  };

  /**
   * @description
   * Opens detail page as a modal about the selected tag.
   *
   * @param tag The target tag to show the detail of.
   */
  const onDetail = (tag: Tag) => {
    setTag(tag);
    setDialogOpened(true);
  };

  const current = isPlaying();

  return (
    <li
      key={tag.id}
      data-playing={current || undefined}
      className="group relative flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50 data-playing:bg-brand/5"
    >
      {/* What is playing gets the brand's mark on its edge */}
      {current && <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-brand" />}

      {isLoggedIn()
        && (
          <div className="flex size-4 shrink-0 items-center justify-center">
            {savingThis
              ? <Spinner aria-label="Saving" className="text-muted-foreground" />
              : (
                  <Tooltip>
                    <TooltipTrigger render={<span className="flex" />}>
                      <Checkbox
                        checked={watched}
                        disabled={saving}
                        aria-label={watched ? "Mark as un-watched" : "Mark as watched"}
                        onCheckedChange={checked => toggleWatched(post.id, tag.id, checked)}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{watched ? "Mark as un-watched" : "Mark as watched"}</TooltipContent>
                  </Tooltip>
                )}
          </div>
        )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={cn("truncate text-sm font-medium", watched && "text-muted-foreground")}>
            {tag.getTitle()}
          </span>

          {current && (
            <Badge className="animate-in bg-brand text-brand-foreground fade-in-0 slide-in-from-left-1">
              {playing ? "Playing" : "Paused"}
            </Badge>
          )}

          {reports.length > 0 && (
            <Tooltip>
              <TooltipTrigger
                render={(
                  <Badge
                    variant="outline"
                    className="cursor-pointer border-warning/40 text-warning hover:bg-warning/10"
                    aria-label={`${reports.length} open reports`}
                    render={<button type="button" onClick={() => review(tag.id)} />}
                  />
                )}
              >
                <Flag />
                {reports.length}
              </TooltipTrigger>
              <TooltipContent>Review the open reports</TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="truncate text-xs text-muted-foreground">
          {tag.entry && (
            <>
              <span className="font-medium text-foreground/70">
                {tag.entry.getTypeName()}
              </span>

              {" · "}
            </>
          )}
          {tag.getDetailDescription()}
        </div>

        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
          <button
            type="button"
            className="rounded-sm font-medium text-foreground/80 underline-offset-2 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-label={`Play from ${tag.getReadableStartTime()}`}
            onClick={() => playFrom(tag.startTime)}
          >
            {tag.getReadableStartTime()}
          </button>
          <span aria-hidden>·</span>
          <span>{tag.getReadableDuration()}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <div className={cn("flex items-center gap-0.5", REVEAL)}>
          <Tooltip>
            <TooltipTrigger
              render={(
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={current ? "restart reaction" : "skip to reaction"}
                  className="text-muted-foreground"
                  onClick={() => playFrom(tag.startTime)}
                />
              )}
            >
              {current ? <RotateCcw /> : <Play />}
            </TooltipTrigger>
            <TooltipContent>{current ? "Restart reaction" : "Skip to reaction"}</TooltipContent>
          </Tooltip>

          {tag.entry && (
            <Tooltip>
              <TooltipTrigger
                render={<Button variant="ghost" size="icon-sm" aria-label="detail" className="text-muted-foreground" onClick={() => onDetail(tag)} />}
              >
                <Info />
              </TooltipTrigger>
              <TooltipContent>Detail</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/*
          * A favorite stays visible. At rest it takes the place of the three
          * dots (one button over) and slides back on hover. An unfavorited
          * heart only appears on hover.
          */}
        {isLoggedIn() && (
          <div
            className={cn(
              "flex size-7 items-center justify-center transition-[opacity,translate] duration-200",
              favorite ? "opacity-100" : REVEAL,
              // Above the hidden dots it covers, so it gets the clicks
              favorite && hasMore && "relative z-10 translate-x-7.5 group-focus-within:translate-x-0 group-hover:translate-x-0",
            )}
          >
            {favorites.isSaving(tag.id)
              ? <Spinner aria-label="Saving" className="text-muted-foreground" />
              : (
                  <Tooltip>
                    <TooltipTrigger
                      render={(
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={favorites.saving}
                          aria-pressed={favorite}
                          aria-label={favorite ? "remove from favorites" : "add to favorites"}
                          className={favorite ? "text-favorite hover:text-favorite" : "text-muted-foreground"}
                          onClick={() => toggleFavorite(post.id, tag.id, !favorite)}
                        />
                      )}
                    >
                      <Heart className={cn(favorite && "fill-current")} />
                    </TooltipTrigger>
                    <TooltipContent>{favorite ? "Remove from favorites" : "Add to favorites"}</TooltipContent>
                  </Tooltip>
                )}
          </div>
        )}

        {hasMore && (
          <div className={REVEAL}>
            <PostReactionMenu tag={tag} />
          </div>
        )}
      </div>
    </li>
  );
}

export default PostReaction;
