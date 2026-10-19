import type { TReport } from "../core/schemas/moderation.schema";

import { isAboutPost, selectReports, useReportsStore } from "./reports.state";



function report(id: string, postId: string, tagId?: string): TReport {
  return { id, kind: tagId ? "timestamp" : "missing", postId, postTitle: "", tagId, note: "", reporterUid: "u1", reporterName: "", createdAt: 1 };
}

const reports = [
  report("r1", "anime-tonight-4-81910896"),
  report("r2", "81910896", "t1"),
  report("r3", "81910896", "t2"),
  report("r4", "other-5-111"),
];

describe("reports store", () => {
  beforeEach(() => {
    useReportsStore.setState({ reports: [] });
  });

  it("replaces the reports with the stored ones", () => {
    useReportsStore.getState().setReports(reports);
    expect(useReportsStore.getState().reports).toBe(reports);

    useReportsStore.getState().setReports([reports[0]!]);
    expect(useReportsStore.getState().reports).toEqual([reports[0]]);
  });

  it("clears the reports when none are stored", () => {
    useReportsStore.getState().setReports(reports);
    useReportsStore.getState().setReports(null);
    expect(useReportsStore.getState().reports).toEqual([]);

    useReportsStore.getState().setReports(reports);
    useReportsStore.getState().setReports(undefined);
    expect(useReportsStore.getState().reports).toEqual([]);
  });
});

describe("isAboutPost", () => {
  it("compares posts by Patreon's numeric id, slug or not", () => {
    expect(isAboutPost(reports[0]!, "81910896")).toBe(true);
    expect(isAboutPost(reports[1]!, "anime-tonight-4-81910896")).toBe(true);
    expect(isAboutPost(reports[3]!, "81910896")).toBe(false);
  });
});

describe("selectReports", () => {
  it("lists every report about the post when no reaction is given", () => {
    expect(selectReports(reports, "81910896", null).map(r => r.id)).toEqual(["r1", "r2", "r3"]);
  });

  it("lists only those about one reaction", () => {
    expect(selectReports(reports, "anime-tonight-4-81910896", "t2").map(r => r.id)).toEqual(["r3"]);
  });

  it("lists only those about the post itself when the reaction is undefined", () => {
    expect(selectReports(reports, "81910896", undefined).map(r => r.id)).toEqual(["r1"]);
  });
});
