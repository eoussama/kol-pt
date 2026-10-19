import type { Tag } from "../../../../core/domain/tag";
import type { IOption } from "../../../../core/types/option.type";

import { EllipsisVertical, ExternalLink, Flag, Pencil, Trash2 } from "lucide-react";
import { Fragment } from "react";
import { useModeration } from "../../../../context/ModerationContext";
import { useAuthStore } from "../../../../state/auth.state";
import { Button } from "../../../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../../../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip";



/**
 * @description
 * Post reaction menu props.
 */
interface IPostReactionMenuProps {

  /**
   * @description
   * The reaction the menu is for.
   */
  tag: Tag;
}

/**
 * @description
 * Renders the "more" button of a post reaction and its menu: links to the
 * reaction's entry on other sites, and what the user can do with it.
 *
 * @param props - The reaction
 * @returns The rendered reaction menu
 */
function PostReactionMenu(props: IPostReactionMenuProps): JSX.Element {
  const { tag } = props;
  const user = useAuthStore(e => e.user);
  const moderator = useAuthStore(e => e.moderator);
  const moderation = useModeration();
  const links = (tag.entry?.getOptions(tag.context) ?? []).filter(option => option.canShow());

  /**
   * @description
   * What signed-in viewers and moderators can do with the reaction.
   */
  const actions: Array<{ label: string; icon: JSX.Element; danger?: boolean; action: () => void }> = !user
    ? []
    : [
        { label: "Report a problem", icon: <Flag />, action: () => moderation.report("timestamp", tag) },
        ...(moderator
          ? [
              { label: "Edit reaction", icon: <Pencil />, action: () => moderation.editTag(tag) },
              { label: "Delete reaction", icon: <Trash2 />, danger: true, action: () => moderation.deleteTag(tag) },
            ]
          : []),
      ];

  /**
   * @description
   * Invokes an option's action. The menu closes on its own.
   *
   * @param option - The menu option to execute
   */
  const onOptionClick = (option: IOption): void => {
    option.action();
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={(
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" aria-label="more" className="text-muted-foreground" />}
            />
          )}
        >
          <EllipsisVertical />
        </TooltipTrigger>
        <TooltipContent>More</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-56">
        {links.length > 0 && (
          <DropdownMenuGroup>
            {links.map(option => (
              <Fragment key={option.label}>
                <DropdownMenuItem onClick={() => onOptionClick(option)}>
                  <img className="size-4 rounded-sm object-contain" src={option.icon} alt={option.iconAlt} />
                  <span className="flex-1 truncate">{option.label}</span>
                  <ExternalLink className="text-muted-foreground" />
                </DropdownMenuItem>
                {option.divider && <DropdownMenuSeparator />}
              </Fragment>
            ))}
          </DropdownMenuGroup>
        )}

        {links.length > 0 && actions.length > 0 && <DropdownMenuSeparator />}

        {actions.length > 0 && (
          <DropdownMenuGroup>
            {actions.map(item => (
              <DropdownMenuItem key={item.label} variant={item.danger ? "destructive" : "default"} onClick={item.action}>
                {item.icon}
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default PostReactionMenu;
