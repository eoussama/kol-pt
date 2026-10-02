import { fakeBrowser } from "wxt/testing/fake-browser";
import { reportsItem } from "../../core/storage/items";
import { readValue, writeValue } from "../database";
import { createReport, loadReports, reportKey, resolveReport } from "./reports";



vi.mock("../database", () => ({
  readValue: vi.fn(async () => null),
  writeValue: vi.fn(async () => undefined),
}));

const user = { uid: "u1", email: "u1@example.com", displayName: "Viewer", photoURL: null };

describe("reports repository", () => {
  beforeEach(() => {
    fakeBrowser.reset();
    vi.mocked(readValue).mockReset().mockResolvedValue(null);
    vi.mocked(writeValue).mockClear();
  });

  it("keys a report by target and reporter, one per kind for whole posts", () => {
    expect(reportKey("u1", { kind: "timestamp", postId: "post.1", tagId: "t1" })).toBe("post_1~t1~u1");
    expect(reportKey("u1", { kind: "missing", postId: "post-1" })).toBe("post-1~missing~u1");
  });

  it("files a report with who filed it and when, without their email", async () => {
    await createReport(user, { kind: "missing", postId: "post-1", postTitle: "Post", note: "Ep 3 is missing", startTime: 30 }, () => 99);

    expect(writeValue).toHaveBeenCalledWith("reports/post-1~missing~u1", {
      id: "post-1~missing~u1",
      kind: "missing",
      postId: "post-1",
      postTitle: "Post",
      note: "Ep 3 is missing",
      startTime: 30,
      reporterUid: "u1",
      reporterName: "Viewer",
      createdAt: 99,
    });
  });

  it("refuses a second open report on the same target", async () => {
    vi.mocked(readValue).mockResolvedValue({ id: "x" });

    await expect(createReport(user, { kind: "missing", postId: "post-1", postTitle: "", note: "" })).rejects.toThrow("already reported");
  });

  it("loads reports newest first and drops closed ones", async () => {
    vi.mocked(readValue).mockResolvedValue({
      a: { id: "a", kind: "missing", postId: "p", reporterUid: "u2", createdAt: 1 },
      b: { id: "b", kind: "untracked", postId: "p", reporterUid: "u3", createdAt: 2 },
      bad: { id: "bad", kind: "other" },
    });

    await expect(loadReports("m1")).resolves.toMatchObject([{ id: "b" }, { id: "a" }]);

    await resolveReport("m1", "b");

    expect(writeValue).toHaveBeenCalledWith("reports/b", null);
    expect((await reportsItem.getValue())?.reports.map(report => report.id)).toEqual(["a"]);
  });
});
