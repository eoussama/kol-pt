import type { Post } from "../../../core/domain/post";

import { Flag, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useModeration } from "../../../context/ModerationContext";
import { cn } from "../../../core/utils/cn";
import { selectReports, useReportsStore } from "../../../state/reports.state";
import { Button } from "../../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "../../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";



/**
 * @description
 * Post moderation menu props.
 */
interface IPostModerationMenuProps {
  post: Post;

  /**
   * @description
   * Whether to list the post's reactions to edit, where they have no
   * controls of their own.
   */
  listReactions?: boolean;

  /**
   * @description
   * Extra classes for the trigger button.
   */
  className?: string;
}

/**
 * @description
 * A moderator's menu for a post: add or edit reactions, review the post's
 * reports, edit its details or stop tracking it. Must be rendered inside a
 * `ModerationProvider` for the post.
 *
 * @param props - The post, and how the menu shows
 * @returns The menu
 */
function PostModerationMenu(props: IPostModerationMenuProps): JSX.Element {
  const { post, listReactions = false, className } = props;
  const allReports = useReportsStore(e => e.reports);
  const moderation = useModeration();
  const postReports = selectReports(allReports, post.id, undefined);
  const reportCount = selectReports(allReports, post.id, null).length;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={(
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" aria-label="moderate" className={cn("relative text-muted-foreground", className)} />}
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
          {listReactions && post.tags.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Pencil />
                Edit a reaction
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-72 w-60 overflow-y-auto">
                {post.tags.map(tag => (
                  <DropdownMenuItem key={tag.id} onClick={() => moderation.editTag(tag)}>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{tag.getTitle()}</span>
                      <span className="truncate text-xs text-muted-foreground">{tag.getDetailDescription()}</span>
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
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
  );
}

export default PostModerationMenu;
