import type { TReport } from "../../../core/schemas/moderation.schema";

import { CircleAlert, Flag, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { request } from "../../../core/messaging/client";
import { Alert, AlertDescription } from "../../ui/alert";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "../../ui/empty";
import { Spinner } from "../../ui/spinner";
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
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="p-4 pr-10 pb-3">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Fix what a report points out, or dismiss it.</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto border-t px-4 py-1">
          {reports.length === 0 && (
            <Empty className="py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon"><ShieldCheck /></EmptyMedia>
                <EmptyTitle>No open reports.</EmptyTitle>
              </EmptyHeader>
            </Empty>
          )}

          {reports.length > 0 && (
            <ul className="divide-y">
              {reports.map(report => (
                <li key={report.id} className="flex flex-col gap-1.5 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Badge variant="outline">
                      <Flag className="text-warning" />
                      {REPORT_KIND_NAMES[report.kind]}
                    </Badge>
                    <span className="truncate text-xs text-muted-foreground tabular-nums">
                      {report.reporterName || "A viewer"}
                      {" · "}
                      {new Date(report.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {report.tagTitle && <p className="font-medium">{report.tagTitle}</p>}
                  {describeSuggestedTimes(report) && <p className="text-muted-foreground tabular-nums">{`Suggested: ${describeSuggestedTimes(report)}`}</p>}
                  {report.note && <p className="border-l-2 pl-2 whitespace-pre-wrap text-muted-foreground italic">{`“${report.note}”`}</p>}

                  <div className="mt-1 flex gap-1.5">
                    {canApply(report) && <Button size="sm" onClick={() => onApply(report)}>Fix</Button>}
                    <Button size="sm" variant="outline" disabled={busy === report.id} onClick={() => dismiss(report)}>
                      {busy === report.id && <Spinner data-icon="inline-start" aria-hidden />}
                      Dismiss
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {error && (
            <Alert variant="destructive" className="mb-3">
              <CircleAlert />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="m-0">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ReportsReviewDialog;
