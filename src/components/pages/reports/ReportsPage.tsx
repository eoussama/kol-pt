import type { TReport } from "../../../core/schemas/moderation.schema";

import CloseIcon from "@mui/icons-material/Close";
import { Alert, Chip, CircularProgress, Divider, IconButton, List, ListItem, Tooltip } from "@mui/material";
import { useEffect, useState } from "react";
import { request } from "../../../core/messaging/client";
import { openPost } from "../../../core/utils/links";
import { useAuthStore } from "../../../state/auth.state";
import { useReportsStore } from "../../../state/reports.state";
import Empty from "../../layout/generic/empty/Empty";
import { describeError } from "../../layout/moderation/errors";
import { describeSuggestedTimes, REPORT_KIND_NAMES } from "../../layout/moderation/report-kinds";
import { ListItemText } from "../../styled/ListItemText";

import styles from "./ReportsPage.module.scss";



/**
 * @description
 * The reports page: every open report, newest first, for moderators.
 * Opening one shows the post on Patreon, where it can be fixed.
 *
 * @returns The rendered reports page
 */
function ReportsPage(): JSX.Element {
  const moderator = useAuthStore(e => e.moderator);
  const reports = useReportsStore(e => e.reports);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reports are filed all the time, so the list is reloaded on every visit
  useEffect(() => {
    request("moderation.refresh", {})
      .catch(failure => setError(describeError(failure)))
      .finally(() => setLoading(false));
  }, []);

  const dismiss = (e: React.MouseEvent, report: TReport) => {
    e.stopPropagation();
    request("reports.resolve", { reportId: report.id }).catch(failure => setError(describeError(failure)));
  };

  if (!moderator) {
    return <Empty message={loading ? <CircularProgress /> : "Only moderators can see reports"}>{[]}</Empty>;
  }

  return (
    <List className={styles.reports}>
      {error && <Alert severity="error" className={styles.reports__error}>{error}</Alert>}

      {loading && reports.length === 0
        ? <div className={styles.reports__loader}><CircularProgress /></div>
        : (
            <Empty message="No open reports. Nice!">
              {reports.map(report => (
                <div key={report.id}>
                  <ListItem
                    className={styles.item}
                    onClick={() => openPost(report.postId, report.tagId)}
                    secondaryAction={(
                      <Tooltip title="Dismiss">
                        <IconButton edge="end" size="small" aria-label="dismiss report" onClick={e => dismiss(e, report)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  >
                    <ListItemText
                      className={styles.item__detail}
                      primary={(
                        <>
                          <Chip size="small" color="warning" label={REPORT_KIND_NAMES[report.kind]} className={styles.item__kind} />
                          {report.tagTitle || report.postTitle || report.postId}
                        </>
                      )}
                      secondary={(
                        <>
                          {report.tagTitle && <span className={styles.item__line}>{report.postTitle}</span>}
                          {describeSuggestedTimes(report) && <span className={styles.item__line}>{`Suggested: ${describeSuggestedTimes(report)}`}</span>}
                          {report.note && <span className={`${styles.item__line} ${styles["item__line--note"]}`}>{`“${report.note}”`}</span>}
                          <span className={styles.item__line}>
                            {`${report.reporterName || "A viewer"} · ${new Date(report.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}`}
                          </span>
                        </>
                      )}
                    />
                  </ListItem>
                  <Divider component="li" />
                </div>
              ))}
            </Empty>
          )}
    </List>
  );
}

export default ReportsPage;
