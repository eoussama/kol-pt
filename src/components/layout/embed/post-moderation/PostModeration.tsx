import { Flag } from "lucide-react";
import { useContext } from "react";
import { useModeration } from "../../../../context/ModerationContext";
import { PostContext } from "../../../../context/PostContext";
import { useAuthStore } from "../../../../state/auth.state";
import { Button } from "../../../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip";
import PostModerationMenu from "../../moderation/PostModerationMenu";



/**
 * @description
 * The panel header's moderation controls: reporting a missing reaction for
 * signed-in viewers, and a moderator menu with the post's open reports.
 *
 * @returns The controls, or nothing when signed out
 */
function PostModeration(): JSX.Element | null {
  const { post } = useContext(PostContext);
  const user = useAuthStore(e => e.user);
  const moderator = useAuthStore(e => e.moderator);
  const moderation = useModeration();

  if (!user) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label="report a missing reaction" className="text-muted-foreground" onClick={() => moderation.report("missing")} />}
        >
          <Flag />
        </TooltipTrigger>
        <TooltipContent>Report a missing reaction</TooltipContent>
      </Tooltip>

      {moderator && <PostModerationMenu post={post} />}
    </span>
  );
}

export default PostModeration;
