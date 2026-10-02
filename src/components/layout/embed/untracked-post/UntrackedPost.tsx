import FlagIcon from "@mui/icons-material/Flag";
import { Button, Chip } from "@mui/material";
import { useMemo, useState } from "react";
import { readPostDetails } from "../../../../content/patreon/post-card";
import { request } from "../../../../core/messaging/client";
import { useAuthStore } from "../../../../state/auth.state";
import { selectReports, useReportsStore } from "../../../../state/reports.state";
import PostDetailsDialog from "../../moderation/PostDetailsDialog";
import ReportDialog from "../../moderation/ReportDialog";
import ReportsReviewDialog from "../../moderation/ReportsReviewDialog";

import styles from "./UntrackedPost.module.scss";



/**
 * @description
 * Untracked post props.
 */
interface IUntrackedPostProps {
  card: HTMLElement;

  /**
   * @description
   * Patreon's numeric id of the post.
   */
  postId: string;
}

/**
 * @description
 * A slim bar under the creator's video posts that are not tracked: viewers
 * can ask for them to be tracked, moderators can track them.
 *
 * @param props - The post's card and id
 * @returns The bar, or nothing when signed out
 */
function UntrackedPost(props: IUntrackedPostProps): JSX.Element | null {
  const { card, postId } = props;
  const user = useAuthStore(e => e.user);
  const moderator = useAuthStore(e => e.moderator);
  const allReports = useReportsStore(e => e.reports);
  const [dialog, setDialog] = useState<"report" | "track" | "review" | null>(null);
  const reports = moderator ? selectReports(allReports, postId, undefined) : [];

  // Read when a dialog opens, as Patreon fills the card in over time
  const details = useMemo(() => ({ ...readPostDetails(card, postId, window.location.href), creationDate: Date.now(), thumbnail: "" }), [card, postId, dialog]);

  if (!user) {
    return null;
  }

  const closeTrack = (saved: boolean) => {
    setDialog(null);

    if (saved) {
      reports.forEach(report => request("reports.resolve", { reportId: report.id }).catch(() => undefined));
    }
  };

  return (
    <div className={styles.untracked}>
      <span className={styles.untracked__text}>KOL PT does not track this post yet.</span>

      {reports.length > 0 && (
        <Chip
          size="small"
          color="warning"
          icon={<FlagIcon />}
          label={reports.length === 1 ? "1 request" : `${reports.length} requests`}
          onClick={() => setDialog("review")}
        />
      )}

      <Button size="small" variant={moderator ? "contained" : "outlined"} disableElevation className={styles.untracked__action} onClick={() => setDialog(moderator ? "track" : "report")}>
        {moderator ? "Track post" : "Ask to track"}
      </Button>

      <ReportDialog open={dialog === "report"} kind="untracked" post={details} onClose={() => setDialog(null)} />

      {moderator && (
        <>
          <PostDetailsDialog open={dialog === "track"} tracked={false} post={details} onClose={closeTrack} />
          <ReportsReviewDialog
            open={dialog === "review"}
            title="Requests to track this post"
            reports={reports}
            canApply={() => true}
            onApply={() => setDialog("track")}
            onClose={() => setDialog(null)}
          />
        </>
      )}
    </div>
  );
}

export default UntrackedPost;
