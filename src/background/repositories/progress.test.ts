import { fakeBrowser } from "wxt/testing/fake-browser";
import { progressItem } from "../../core/storage/items";
import { readValue, updateValues } from "../database";
import { clearProgress, loadProgress, setProgress } from "./progress";



vi.mock("../database", () => ({
  readValue: vi.fn(),
  updateValues: vi.fn(async () => undefined),
}));

describe("progress repository", () => {
  beforeEach(() => {
    fakeBrowser.reset();
    vi.mocked(readValue).mockReset();
    vi.mocked(updateValues).mockClear();
  });

  it("loads the user's positions into storage and clears them", async () => {
    vi.mocked(readValue).mockResolvedValue({ "post-1": { time: 60, updatedAt: 5 } });

    await loadProgress("u1");

    expect(readValue).toHaveBeenCalledWith("users/u1/progress");
    await expect(progressItem.getValue()).resolves.toEqual({ uid: "u1", posts: { "post-1": { time: 60, updatedAt: 5 } } });

    await clearProgress();

    await expect(progressItem.getValue()).resolves.toBeNull();
  });

  it("writes only the post's position, and forgets it", async () => {
    await progressItem.setValue({ uid: "u1", posts: { "post-1": { time: 60, updatedAt: 5 } } });

    await setProgress("u1", "post.2", 90, () => 10);

    expect(updateValues).toHaveBeenLastCalledWith("users/u1/progress", { post_2: { time: 90, updatedAt: 10 } });
    await expect(progressItem.getValue()).resolves.toEqual({ uid: "u1", posts: { "post-1": { time: 60, updatedAt: 5 }, "post_2": { time: 90, updatedAt: 10 } } });

    await setProgress("u1", "post-1", null);

    expect(updateValues).toHaveBeenLastCalledWith("users/u1/progress", { "post-1": null });
    await expect(progressItem.getValue()).resolves.toEqual({ uid: "u1", posts: { post_2: { time: 90, updatedAt: 10 } } });
  });

  it("does not mix users' positions", async () => {
    vi.mocked(readValue).mockResolvedValue(null);
    await progressItem.setValue({ uid: "someone-else", posts: { p9: { time: 1, updatedAt: 1 } } });

    await setProgress("u1", "p1", 30, () => 2);

    await expect(progressItem.getValue()).resolves.toEqual({ uid: "u1", posts: { p1: { time: 30, updatedAt: 2 } } });
  });
});
