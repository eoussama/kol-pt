import type { TReport } from "../../../core/schemas/moderation.schema";

import { TriangleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";
import { request } from "../../../core/messaging/client";
import { openPost } from "../../../core/utils/links";
import { useAuthStore } from "../../../state/auth.state";
import { useReportsStore } from "../../../state/reports.state";
import Empty from "../../layout/generic/empty/Empty";
import { describeError } from "../../layout/moderation/errors";
import { describeSuggestedTimes, REPORT_KIND_NAMES } from "../../layout/moderation/report-kinds";
import { Alert, AlertDescription } from "../../ui/alert";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Skeleton } from "../../ui/skeleton";
import { Spinner } from "../../ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";



/**
 * @description
 * Placeholder rows shown while the reports load, shaped like the real rows.
 *
 * @returns The rendered placeholder list
 */
function ReportsSkeleton(): JSX.Element {
  return (
    <div aria-busy="true" aria-label="Loading reports" className="divide-y overflow-hidden rounded-xl border bg-card">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex flex-col gap-1.5 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-3.5 w-1/2" />
          </div>
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-2/5" />
        </div>
      ))}
    </div>
  );
}

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
    return loading
      ? <div className="flex justify-center py-16 text-muted-foreground"><Spinner className="size-5" /></div>
      : <Empty message="Only moderators can see reports">{[]}</Empty>;
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      {error && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && reports.length === 0
        ? <ReportsSkeleton />
        : (
            <Empty message="No open reports. Nice!">
              {reports.length > 0
                ? [
                    <ul key="reports" className="divide-y overflow-hidden rounded-xl border bg-card">
                      {reports.map(report => (
                        <li key={report.id} className="relative flex items-start gap-1 py-2.5 pr-2 pl-3 transition-colors hover:bg-muted/50 has-[[data-slot=report-open]:focus-visible]:bg-muted/50">
                          {/* The whole row opens the post, through this button stretched over it */}
                          <button
                            type="button"
                            data-slot="report-open"
                            onClick={() => openPost(report.postId, report.tagId)}
                            className="flex min-w-0 flex-1 flex-col gap-0.5 text-left outline-none after:absolute after:inset-0 after:content-['']"
                          >
                            <span className="flex min-w-0 items-center gap-1.5">
                              <Badge className="border-transparent bg-warning/15 text-warning">{REPORT_KIND_NAMES[report.kind]}</Badge>
                              <span className="truncate text-sm font-medium">{report.tagTitle || report.postTitle || report.postId}</span>
                            </span>

                            {report.tagTitle && <span className="truncate text-xs text-muted-foreground">{report.postTitle}</span>}
                            {describeSuggestedTimes(report) && <span className="truncate text-xs text-muted-foreground tabular-nums">{`Suggested: ${describeSuggestedTimes(report)}`}</span>}
                            {report.note && <span className="text-xs text-foreground/80 italic">{`“${report.note}”`}</span>}
                            <span className="truncate text-xs text-muted-foreground tabular-nums">
                              {`${report.reporterName || "A viewer"} · ${new Date(report.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}`}
                            </span>
                          </button>

                          <Tooltip>
                            <TooltipTrigger
                              render={(
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  aria-label="dismiss report"
                                  onClick={e => dismiss(e, report)}
                                  className="relative z-10 shrink-0 text-muted-foreground"
                                />
                              )}
                            >
                              <X />
                            </TooltipTrigger>
                            <TooltipContent>Dismiss</TooltipContent>
                          </Tooltip>
                        </li>
                      ))}
                    </ul>,
                  ]
                : []}
            </Empty>
          )}
    </div>
  );
}

export default ReportsPage;
