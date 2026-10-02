import type { IOption } from "../../../../core/types/option.type";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EditIcon from "@mui/icons-material/Edit";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import OutlinedFlagIcon from "@mui/icons-material/OutlinedFlag";
import { Divider, Menu, MenuItem } from "@mui/material";
import { useContext } from "react";
import { useModeration } from "../../../../context/ModerationContext";
import { ReactionOverlayContext } from "../../../../context/ReactionOverlayContext";
import { useAuthStore } from "../../../../state/auth.state";

import styles from "./PostReactionMenu.module.scss";



/**
 * @description
 * Renders a popover menu for a post reaction.
 *
 * @returns The rendered reaction menu
 */
function PostReactionMenu(): JSX.Element {
  const { tag, anchorEl, anchorOpened, setAnchorOpened } = useContext(ReactionOverlayContext);
  const user = useAuthStore(e => e.user);
  const moderator = useAuthStore(e => e.moderator);
  const moderation = useModeration();
  const links = (tag?.entry?.getOptions(tag.context) ?? []).filter(option => option.canShow());

  /**
   * @description
   * What signed-in viewers and moderators can do with the reaction.
   */
  const actions: Array<{ label: string; icon: JSX.Element; danger?: boolean; action: () => void }> = !tag || !user
    ? []
    : [
        { label: "Report a problem", icon: <OutlinedFlagIcon />, action: () => moderation.report("timestamp", tag) },
        ...(moderator
          ? [
              { label: "Edit reaction", icon: <EditIcon />, action: () => moderation.editTag(tag) },
              { label: "Delete reaction", icon: <DeleteOutlineIcon />, danger: true, action: () => moderation.deleteTag(tag) },
            ]
          : []),
      ];

  /**
   * @description
   * Closes the menu element
   */
  const onClose = () => {
    setAnchorOpened(false);
  };

  /**
   * @description
   * Invokes option action and closes the menu element
   *
   * @param option - The menu option to execute
   */
  const onOptionClick = (option: IOption): void => {
    onClose();
    option.action();
  };

  return (
    <>
      <Menu
        onClose={onClose}
        anchorEl={anchorEl}
        open={anchorOpened}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              "mt": 1.5,
              "overflow": "visible",
              "filter": "drop-shadow(0px 0px 8px rgba(0,0,0,0.2))",
              "& .MuiAvatar-root": {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              "& .MuiMenuItem-root": {
                fontSize: 14,
                display: "flex",
                alignItems: "center",
              },
              "&:before": {
                content: "\"\"",
                display: "block",
                position: "absolute",
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: "background.paper",
                transform: "translateY(-50%) rotate(45deg)",
                zIndex: 0,
              },
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {/* A flat list: Menu does not accept fragments as children */}
        {links
          .flatMap(option => [
            <MenuItem
              key={option.label}
              className={styles["popover-item"]}
              onClick={() => onOptionClick(option)}
            >
              <img
                className={styles["popover-icon"]}
                src={option.icon}
                alt={option.iconAlt}
              />
              <span>{option.label}</span>
              <OpenInNewIcon />
            </MenuItem>,
            ...(option.divider ? [<Divider key={`${option.label}-divider`} />] : []),
          ])}
        {links.length > 0 && actions.length > 0 && <Divider key="actions-divider" />}
        {actions.map(item => (
          <MenuItem
            key={item.label}
            className={styles["popover-action"]}
            sx={item.danger ? { color: "error.main" } : undefined}
            onClick={() => {
              onClose();
              item.action();
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export default PostReactionMenu;
