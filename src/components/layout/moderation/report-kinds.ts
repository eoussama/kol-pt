import type { TReport, TReportKind } from "../../../core/schemas/moderation.schema";

import { formatTimestamp } from "../../../core/utils/time";



/**
 * @description
 * How each kind of report is named to moderators.
 */
export const REPORT_KIND_NAMES: Record<TReportKind, string> = {
  timestamp: "Wrong timestamp",
  entry: "Wrong show or episode",
  missing: "Missing reaction",
  untracked: "Untracked post",
};

/**
 * @description
 * Describes the times a report suggests.
 *
 * @param report - The report
 * @returns e.g. `0:12:00 → 0:24:00`, or an empty string
 */
export function describeSuggestedTimes(report: TReport): string {
  const start = report.startTime === undefined ? "?" : formatTimestamp(report.startTime);
  const end = report.endTime === undefined ? "?" : formatTimestamp(report.endTime);

  return report.startTime === undefined && report.endTime === undefined ? "" : `${start} → ${end}`;
}
