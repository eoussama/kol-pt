import type { TReport, TReportInput } from "../../core/schemas/moderation.schema";
import type { IAuthUser } from "../../core/types/auth-user.type";

import { ReportSchema } from "../../core/schemas/moderation.schema";
import { listOf } from "../../core/schemas/primitives.schema";
import { reportsItem } from "../../core/storage/items";
import { toDatabaseKey } from "../../core/utils/watchlist";
import { readValue, writeValue } from "../database";
import { withoutUndefined } from "./keyed";



const ReportListSchema = listOf(ReportSchema);

/**
 * @description
 * Where a report is stored: one per user and target (a reaction, or a post
 * for a kind of problem), so a user cannot file the same report twice while
 * it is open. The database rules check that the key ends with the uid.
 *
 * @param uid - The reporter's ID
 * @param report - The report
 * @returns The report's key
 */
export function reportKey(uid: string, report: Pick<TReportInput, "kind" | "postId" | "tagId">): string {
  const target = report.tagId === undefined ? report.kind : toDatabaseKey(report.tagId);

  return `${toDatabaseKey(report.postId)}~${target}~${uid}`;
}

/**
 * @description
 * Files a report.
 *
 * @param user - The reporter
 * @param input - What they report
 * @param now - The current time, in epoch milliseconds
 * @returns Promise that resolves once filed
 */
export async function createReport(user: IAuthUser, input: TReportInput, now: () => number = Date.now): Promise<void> {
  const id = reportKey(user.uid, input);

  if ((await readValue(`reports/${id}`)) != null) {
    throw new Error("You already reported this. A moderator will look at it soon.");
  }

  const report: TReport = {
    ...input,
    id,
    reporterUid: user.uid,
    reporterName: (user.displayName ?? "").slice(0, 100),
    createdAt: now(),
  };

  await writeValue(`reports/${id}`, withoutUndefined(report));
}

/**
 * @description
 * Loads the open reports into extension storage, for a moderator.
 *
 * @param uid - The moderator's ID
 * @returns Promise resolving to the reports, newest first
 */
export async function loadReports(uid: string): Promise<Array<TReport>> {
  const reports = ReportListSchema.parse(await readValue("reports")).sort((a, b) => b.createdAt - a.createdAt);

  await reportsItem.setValue({ uid, reports });

  return reports;
}

/**
 * @description
 * Forgets the reports, e.g. after signing out.
 *
 * @returns Promise that resolves once cleared
 */
export function clearReports(): Promise<void> {
  return reportsItem.setValue(null);
}

/**
 * @description
 * Closes a report, whether it was acted on or dismissed.
 *
 * @param uid - The moderator's ID
 * @param reportId - The report's ID
 * @returns Promise that resolves once closed
 */
export async function resolveReport(uid: string, reportId: string): Promise<void> {
  await writeValue(`reports/${reportId}`, null);

  const current = await reportsItem.getValue();

  await reportsItem.setValue({
    uid,
    reports: current?.uid === uid ? current.reports.filter(report => report.id !== reportId) : [],
  });
}
