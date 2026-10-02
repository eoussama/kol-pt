import type { TReport } from "../core/schemas/moderation.schema";

import { create } from "zustand";
import { toNumericPostId } from "../core/utils/post-id";



/**
 * @description
 * The open reports, for moderators.
 */
export interface IReportsState {

  /**
   * @description
   * The open reports, newest first.
   */
  reports: ReadonlyArray<TReport>;

  /**
   * @description
   * Replaces the reports with the stored ones.
   */
  setReports: (reports: ReadonlyArray<TReport> | null | undefined) => void;
}

/**
 * @description
 * State management store for the open reports. Kept in sync with extension
 * storage by `useReportsSync`.
 */
export const useReportsStore = create<IReportsState>(set => ({
  reports: [],
  setReports: reports => set({ reports: reports ?? [] }),
}));

/**
 * @description
 * Whether a report is about a post. Reports on untracked posts name the
 * post by Patreon's numeric id, tracked ones by its URL slug, so both are
 * compared by the numeric id.
 *
 * @param report - The report
 * @param postId - The post's ID, numeric or slug
 * @returns True if the report is about that post
 */
export function isAboutPost(report: TReport, postId: string): boolean {
  return toNumericPostId(report.postId) === toNumericPostId(postId);
}

/**
 * @description
 * A post's open reports.
 *
 * @param reports - Every open report
 * @param postId - The post's ID
 * @param tagId - Only those about this reaction; undefined for those about the post itself, null for all
 * @returns The matching reports
 */
export function selectReports(reports: ReadonlyArray<TReport>, postId: string, tagId: string | null | undefined): Array<TReport> {
  return reports.filter(report => isAboutPost(report, postId) && (tagId === null || report.tagId === tagId));
}
