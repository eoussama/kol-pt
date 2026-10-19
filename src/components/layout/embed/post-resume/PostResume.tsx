import { History, Play } from "lucide-react";
import { useContext } from "react";
import { usePlayer } from "../../../../content/player/PlayerProvider";
import { PostContext } from "../../../../context/PostContext";
import { findReactionAt } from "../../../../core/utils/progress";
import { formatTimestamp } from "../../../../core/utils/time";
import { useAuthStore } from "../../../../state/auth.state";
import { usePostProgress } from "../../../../state/progress.state";
import { Button } from "../../../ui/button";



/**
 * @description
 * How far, in seconds, the playhead must be from the saved position for
 * resuming to be offered.
 */
const RESUME_OFFER_DISTANCE_S = 5;

/**
 * @description
 * Offers to resume a post's video where the signed-in user stopped watching
 * it. Hidden while the video plays, and when the playhead is already there.
 *
 * @returns The resume row, or nothing
 */
function PostResume(): JSX.Element | null {
  const { post } = useContext(PostContext);
  const user = useAuthStore(e => e.user);
  const progress = usePostProgress(post.id);
  const { ready, playing, currentTime, playFrom } = usePlayer();

  if (!user || !progress || !ready || playing || Math.abs(currentTime - progress.time) <= RESUME_OFFER_DISTANCE_S) {
    return null;
  }

  const reaction = findReactionAt(post.tags, progress.time);

  return (
    <div className="flex items-center gap-3 border-b bg-brand/8 px-3 py-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand-strong">
        <History className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">Continue watching</div>
        <div className="truncate text-xs text-muted-foreground">
          {reaction ? `${reaction.getTitle()} · ` : ""}
          left off at
          {" "}
          <span className="font-medium text-foreground tabular-nums">{formatTimestamp(progress.time)}</span>
        </div>
      </div>

      <Button size="sm" className="shrink-0" onClick={() => playFrom(progress.time)}>
        <Play data-icon="inline-start" />
        Resume
      </Button>
    </div>
  );
}

export default PostResume;
