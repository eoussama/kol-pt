import type { TReport } from "../../../core/schemas/moderation.schema";

import { describeSuggestedTimes, REPORT_KIND_NAMES } from "./report-kinds";



/**
 * @description
 * Builds a report with the given suggested times.
 *
 * @param times - The report's suggested times
 * @returns The report
 */
function reportWith(times: Pick<TReport, "startTime" | "endTime">): TReport {
  return { id: "r1", kind: "timestamp", postId: "p1", postTitle: "", note: "", reporterUid: "u1", reporterName: "", createdAt: 0, ...times };
}

describe("report kinds", () => {
  it("names every kind of report", () => {
    expect(REPORT_KIND_NAMES).toEqual({
      timestamp: "Wrong timestamp",
      entry: "Wrong show or episode",
      missing: "Missing reaction",
      untracked: "Untracked post",
    });
  });
});

describe("describeSuggestedTimes", () => {
  it("shows both suggested times", () => {
    expect(describeSuggestedTimes(reportWith({ startTime: 720, endTime: 1440 }))).toBe("0:12:00 → 0:24:00");
  });

  it("marks a missing end or start with a question mark", () => {
    expect(describeSuggestedTimes(reportWith({ startTime: 10 }))).toBe("0:00:10 → ?");
    expect(describeSuggestedTimes(reportWith({ endTime: 65 }))).toBe("? → 0:01:05");
  });

  it("keeps a time of zero", () => {
    expect(describeSuggestedTimes(reportWith({ startTime: 0, endTime: 0 }))).toBe("0:00:00 → 0:00:00");
  });

  it("is empty when no time is suggested", () => {
    expect(describeSuggestedTimes(reportWith({}))).toBe("");
  });
});
