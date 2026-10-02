import AddIcon from "@mui/icons-material/Add";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditIcon from "@mui/icons-material/Edit";
import FlagIcon from "@mui/icons-material/Flag";
import OutlinedFlagIcon from "@mui/icons-material/OutlinedFlag";
import { Badge, Divider, IconButton, ListItemIcon, Menu, MenuItem, Tooltip } from "@mui/material";
import { useContext, useState } from "react";
import { useModeration } from "../../../../context/ModerationContext";
import { PostContext } from "../../../../context/PostContext";
import { useAuthStore } from "../../../../state/auth.state";
import { selectReports, useReportsStore } from "../../../../state/reports.state";

import styles from "./PostModeration.module.scss";



/**
 * @description
 * Stops a click in the panel's header from toggling the panel.
 *
 * @param e - The click
 */
function keepPanel(e: React.MouseEvent): void {
  e.stopPropagation();
}

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
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const postReports = moderator ? selectReports(allReports, post.id, undefined) : [];
  const reportCount = moderator ? selectReports(allReports, post.id, null).length : 0;

  if (!user) {
    return null;
  }

  const run = (action: () => void) => () => {
    setAnchor(null);
    action();
  };

  return (
    <span className={styles.moderation} onClick={keepPanel}>
      <Tooltip title="Report a missing reaction">
        <IconButton size="small" aria-label="report a missing reaction" onClick={() => moderation.report("missing")}>
          <OutlinedFlagIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {moderator && (
        <>
          <Tooltip title={reportCount > 0 ? `Moderate (${reportCount} open reports)` : "Moderate"}>
            <IconButton size="small" aria-label="moderate" onClick={e => setAnchor(e.currentTarget)}>
              <Badge badgeContent={reportCount} color="warning" max={99}>
                <AdminPanelSettingsIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          <Menu anchorEl={anchor} open={anchor !== null} onClose={() => setAnchor(null)} onClick={keepPanel}>
            <MenuItem onClick={run(() => moderation.editTag(null))}>
              <ListItemIcon><AddIcon fontSize="small" /></ListItemIcon>
              Add a reaction
            </MenuItem>
            {postReports.length > 0 && (
              <MenuItem onClick={run(() => moderation.review())}>
                <ListItemIcon><FlagIcon fontSize="small" color="warning" /></ListItemIcon>
                {`Review post reports (${postReports.length})`}
              </MenuItem>
            )}
            <MenuItem onClick={run(moderation.editPost)}>
              <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
              Edit post details
            </MenuItem>
            <Divider />
            <MenuItem onClick={run(moderation.untrackPost)} sx={{ color: "error.main" }}>
              <ListItemIcon><DeleteOutlinedIcon fontSize="small" color="error" /></ListItemIcon>
              Stop tracking this post
            </MenuItem>
          </Menu>
        </>
      )}
    </span>
  );
}

export default PostModeration;
