import { Flag, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useContext } from "react";
import { useModeration } from "../../../../context/ModerationContext";
import { PostContext } from "../../../../context/PostContext";
import { useAuthStore } from "../../../../state/auth.state";
import { selectReports, useReportsStore } from "../../../../state/reports.state";
import { Button } from "../../../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../../../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip";



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
  const allReports = useReportsStore(e => e.reports);
  const moderation = useModeration();
  const postReports = moderator ? selectReports(allReports, post.id, undefined) : [];
  const reportCount = moderator ? selectReports(allReports, post.id, null).length : 0;

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

      {moderator && (
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger
              render={(
                <DropdownMenuTrigger
                  render={<Button variant="ghost" size="icon-sm" aria-label="moderate" className="relative text-muted-foreground" />}
                />
              )}
            >
              <ShieldCheck />
              {reportCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[10px] leading-none font-semibold text-white tabular-nums ring-2 ring-card">
                  {reportCount > 99 ? "99+" : reportCount}
                </span>
              )}
            </TooltipTrigger>
            <TooltipContent>{reportCount > 0 ? `Moderate (${reportCount} open reports)` : "Moderate"}</TooltipContent>
          </Tooltip>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => moderation.editTag(null)}>
                <Plus />
                Add a reaction
              </DropdownMenuItem>
              {postReports.length > 0 && (
                <DropdownMenuItem onClick={() => moderation.review()}>
                  <Flag className="text-warning" />
                  {`Review post reports (${postReports.length})`}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => moderation.editPost()}>
                <Pencil />
                Edit post details
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => moderation.untrackPost()}>
              <Trash2 />
              Stop tracking this post
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </span>
  );
}

export default PostModeration;
