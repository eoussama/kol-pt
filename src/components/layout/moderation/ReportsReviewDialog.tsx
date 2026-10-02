import type { TReport } from "../../../core/schemas/moderation.schema";

import { Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, List, ListItem, Stack, Typography } from "@mui/material";
import { Fragment, useState } from "react";
import { request } from "../../../core/messaging/client";
import { describeError } from "./errors";
import { describeSuggestedTimes, REPORT_KIND_NAMES } from "./report-kinds";



/**
 * @description
 * Reports review props.
 */
export interface IReportsReviewDialogProps {
  open: boolean;
  title: string;
  reports: ReadonlyArray<TReport>;

  /**
   * @description
   * Opens the fix for a report, if it can be fixed from here. The report is
   * closed once the fix is saved.
   */
  onApply: (report: TReport) => void;

  /**
   * @description
   * Whether a report can be fixed from here.
   */
  canApply: (report: TReport) => boolean;
  onClose: () => void;
}

/**
 * @description
 * Lists a post's or a reaction's open reports, for a moderator to fix or
 * dismiss.
 *
 * @param props - The reports and the fix to open for one
 * @returns The dialog
 */
function ReportsReviewDialog(props: IReportsReviewDialogProps): JSX.Element {
  const { open, title, reports, onApply, canApply, onClose } = props;
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dismiss = async (report: TReport) => {
    setBusy(report.id);
    setError(null);

    try {
      await request("reports.resolve", { reportId: report.id });
    }
    catch (failure) {
      setError(describeError(failure));
    }
    finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>

      <DialogContent dividers>
        {reports.length === 0 && <Typography color="text.secondary">No open reports.</Typography>}

        <List disablePadding>
          {reports.map((report, i) => (
            <Fragment key={report.id}>
              {i > 0 && <Divider component="li" />}
              <ListItem disableGutters sx={{ display: "block", py: 1.5 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                  <Chip size="small" color="warning" label={REPORT_KIND_NAMES[report.kind]} />
                  <Typography variant="caption" color="text.secondary">
                    {report.reporterName || "A viewer"}
                    {" · "}
                    {new Date(report.createdAt).toLocaleString()}
                  </Typography>
                </Stack>

                {report.tagTitle && <Typography variant="body2">{report.tagTitle}</Typography>}
                {describeSuggestedTimes(report) && <Typography variant="body2">{`Suggested: ${describeSuggestedTimes(report)}`}</Typography>}
                {report.note && <Typography variant="body2" sx={{ fontStyle: "italic", whiteSpace: "pre-wrap" }}>{`“${report.note}”`}</Typography>}

                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  {canApply(report) && <Button size="small" variant="contained" disableElevation onClick={() => onApply(report)}>Fix</Button>}
                  <Button size="small" disabled={busy === report.id} onClick={() => dismiss(report)}>Dismiss</Button>
                </Stack>
              </ListItem>
            </Fragment>
          ))}
        </List>

        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ReportsReviewDialog;
