import { ChevronDown, Info, X } from "lucide-react";
import { useContext, useEffect, useState } from "react";

import { usePlayer } from "../../../../content/player/PlayerProvider";
import { PostContext } from "../../../../context/PostContext";
import { ReactionOverlayContext } from "../../../../context/ReactionOverlayContext";
import { getImageUrl } from "../../../../core/utils/assets";
import { openPassione } from "../../../../core/utils/links";
import { useAutoWatch } from "../../../../hooks/auto-watch.hook";
import { useProgressTracking } from "../../../../hooks/progress.hook";
import { useAuthStore } from "../../../../state/auth.state";
import { usePostWatchlist } from "../../../../state/watchlist.state";
import EntryView from "../../../pages/entry/EntryView";
import { Alert, AlertAction, AlertDescription } from "../../../ui/alert";
import { Button } from "../../../ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip";
import PostModeration from "../post-moderation/PostModeration";
import PostReaction from "../post-reaction/PostReaction";
import PostResume from "../post-resume/PostResume";



/**
 * @description
 * Animates a collapsible's height as it opens and closes.
 */
const COLLAPSE = "h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none";

/**
 * @description
 * Component that renders all reactions for a post
 *
 * @returns The rendered reactions panel
 */
function PostReactions(): JSX.Element {
  const { post } = useContext(PostContext);
  const { ready, cue } = usePlayer();

  useAutoWatch(post);
  useProgressTracking(post);
  const user = useAuthStore(e => e.user);
  const authReady = useAuthStore(e => e.ready);
  const { isWatched } = usePostWatchlist(post.id);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState<boolean>(true);
  const { tag, dialogOpened, setDialogOpened } = useContext(ReactionOverlayContext);

  // Nothing to show, so the panel stays closed
  const empty = post.tags.length === 0;
  const watchedCount = post.tags.filter(tag => isWatched(tag.id)).length;

  /**
   * @description
   * Generates proper title for the panel
   *
   * @returns The reactions count label
   */
  const getReactionsTitle = () => {
    const reactionCount = post.tags.length;
    const reactionText = reactionCount === 1 ? "reaction" : "reactions";

    return `${reactionCount} ${reactionText}`;
  };

  /**
   * @description
   * Opens the Passione channel
   */
  const onPassioneOpen = () => {
    openPassione();
  };

  // Positioning the video where the popup's link says (?resumeAt= or ?reactionId=)
  useEffect(() => {
    if (!ready) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const resumeAt = Number(params.get("resumeAt") ?? Number.NaN);
    const reactionId = params.get("reactionId");
    const reaction = reactionId ? post.tags.find(tag => tag.id === reactionId) : undefined;

    if (Number.isFinite(resumeAt) && resumeAt >= 0) {
      cue(resumeAt);
    }
    else if (reaction) {
      cue(reaction.startTime);
    }
  }, [ready, cue, post]);

  // A dismissed callout comes back after signing out and in again
  useEffect(() => {
    setDismissed(false);
  }, [user?.uid]);

  // Only once the stored sign-in is known, so it never shows just to vanish
  const alertOpen = authReady && !user && !dismissed;

  return (
    <>
      <Collapsible open={alertOpen}>
        <CollapsibleContent keepMounted className={COLLAPSE}>
          <div className="pb-2">
            <Alert>
              <Info />
              <AlertDescription className="text-foreground">
                <Tooltip>
                  <TooltipTrigger render={<span className="cursor-help font-medium underline decoration-dotted underline-offset-2" />}>
                    Login to KOL PT
                  </TooltipTrigger>
                  <TooltipContent>Open the KOL PT extension popup and login to enable progress tracking</TooltipContent>
                </Tooltip>
                {" "}
                in order to track your progress.
              </AlertDescription>
              <AlertAction>
                <Tooltip>
                  <TooltipTrigger
                    render={<Button variant="ghost" size="icon-xs" aria-label="Login in notice" onClick={() => setDismissed(true)} />}
                  >
                    <X />
                  </TooltipTrigger>
                  <TooltipContent>Dismiss</TooltipContent>
                </Tooltip>
              </AlertAction>
            </Alert>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible
        open={expanded && !empty}
        onOpenChange={open => !empty && setExpanded(open)}
        className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs"
      >
        <div className="flex items-center gap-2 py-1.5 pr-1.5 pl-2">
          <CollapsibleTrigger
            disabled={empty}
            className="group/trigger flex min-w-0 flex-1 items-center gap-2 rounded-md p-1 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default"
          >
            <span className="text-sm font-semibold">{getReactionsTitle()}</span>
            {user && !empty && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {`${watchedCount}/${post.tags.length} watched`}
              </span>
            )}
            {!empty && (
              <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-data-panel-open/trigger:rotate-180" />
            )}
          </CollapsibleTrigger>

          <span className="flex shrink-0 items-center gap-0.5">
            <PostModeration />

            <Tooltip>
              <TooltipTrigger
                render={<Button variant="ghost" size="icon-sm" aria-label="Opens KOl's Discord server" onClick={onPassioneOpen} />}
              >
                <img src={getImageUrl("discord", "platforms")} alt="Discord icon" className="size-4 object-contain" />
              </TooltipTrigger>
              <TooltipContent>Open Passione Club Channel</TooltipContent>
            </Tooltip>
          </span>
        </div>

        <CollapsibleContent className={COLLAPSE}>
          <div className="border-t">
            <PostResume />

            <ul className="m-0 list-none divide-y p-0">
              {post.tags.map(tag => <PostReaction key={tag.id} tag={tag} />)}
            </ul>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Dialog open={dialogOpened} onOpenChange={setDialogOpened}>
        <DialogContent className="max-h-[85vh] gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="border-b px-4 py-3">
            <DialogTitle>Reaction info</DialogTitle>
          </DialogHeader>

          <div className="max-h-[calc(85vh-3.25rem)] overflow-y-auto">
            <EntryView entryId={tag?.entry?.id ?? ""} isDialog={true} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PostReactions;
