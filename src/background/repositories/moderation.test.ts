import { fakeBrowser } from "wxt/testing/fake-browser";
import { moderatorItem } from "../../core/storage/items";
import { readValue, updateValues, writeValue } from "../database";
import { getPostsWithEntries } from "./content";
import { deleteTag, isModerator, mergeEdit, refreshModerator, saveEntry, savePost, saveTag } from "./moderation";



vi.mock("../database", () => ({
  readValue: vi.fn(),
  writeValue: vi.fn(async () => undefined),
  updateValues: vi.fn(async () => undefined),
}));
vi.mock("./content", () => ({ getPostsWithEntries: vi.fn(async () => ({ posts: [], entries: [] })) }));

const db: Record<string, unknown> = {};

const tag = { id: "t2", entryId: "e1", label: "Ep 2", description: "", startTime: 10, endTime: 20, context: {} };

describe("moderation repository", () => {
  beforeEach(() => {
    fakeBrowser.reset();
    vi.mocked(writeValue).mockClear();
    vi.mocked(updateValues).mockClear();
    vi.mocked(getPostsWithEntries).mockClear();
    for (const key of Object.keys(db)) {
      delete db[key];
    }
    vi.mocked(readValue).mockImplementation(async path => db[path] ?? null);
  });

  it("knows moderators, and treats unreadable flags as not one", async () => {
    db["moderators/u1"] = true;

    await expect(isModerator("u1")).resolves.toBe(true);
    await expect(isModerator("u2")).resolves.toBe(false);

    vi.mocked(readValue).mockRejectedValueOnce(new Error("Permission denied"));
    await expect(isModerator("u1")).resolves.toBe(false);
  });

  it("records the moderator flag for the pages", async () => {
    db["moderators/u1"] = true;

    await refreshModerator("u1");
    await expect(moderatorItem.getValue()).resolves.toEqual({ uid: "u1", moderator: true });

    await refreshModerator(null);
    await expect(moderatorItem.getValue()).resolves.toBeNull();
  });

  it("keys array-stored lists before the first change, then writes only the reaction", async () => {
    db.posts = [{ id: "post-1", title: "One", tags: [{ id: "t1" }] }];
    db.entries = [{ id: "e1", title: "Show" }];
    db["posts/post-1/id"] = "post-1";

    await saveTag("post-1", tag);

    expect(writeValue).toHaveBeenNthCalledWith(1, "posts", { "post-1": { id: "post-1", title: "One", tags: { t1: { id: "t1" } } } });
    expect(writeValue).toHaveBeenNthCalledWith(2, "entries", { e1: { id: "e1", title: "Show" } });
    expect(writeValue).toHaveBeenNthCalledWith(3, "posts/post-1/tags/t2", tag);
    expect(getPostsWithEntries).toHaveBeenCalledWith(true);
  });

  it("leaves keyed lists alone", async () => {
    db.posts = { "post-1": { id: "post-1", tags: { t1: { id: "t1" } } } };
    db.entries = { e1: { id: "e1" } };

    await deleteTag("post-1", "t1");

    expect(writeValue).toHaveBeenCalledExactlyOnceWith("posts/post-1/tags/t1", null);
  });

  it("refuses reactions on untracked posts", async () => {
    await expect(saveTag("post-9", tag)).rejects.toThrow("not tracked");
  });

  it("updates a post's details without touching its reactions", async () => {
    await savePost({ id: "post-1", title: "One", description: "", creationDate: 5, thumbnail: "" });

    expect(updateValues).toHaveBeenCalledWith("posts/post-1", { id: "post-1", title: "One", description: "", creationDate: 5, thumbnail: "" });
  });

  it("keeps stored fields the editors do not show, and removes cleared ones", async () => {
    db.entries = { e1: { id: "e1", type: 1, title: "Old", altTitles: [], rottentomatoesId: "rt", imdbId: "tt1", legacy: 1 } };
    db["entries/e1"] = (db.entries as Record<string, unknown>).e1;

    await saveEntry({ id: "e1", type: 1, title: "New", altTitles: ["N"], imdbId: undefined, cover: undefined, rottentomatoesId: "rt" });

    expect(writeValue).toHaveBeenLastCalledWith("entries/e1", { id: "e1", type: 1, title: "New", altTitles: ["N"], rottentomatoesId: "rt", legacy: 1 });
  });

  it("merges a reaction's context the same way", async () => {
    db.posts = { "post-1": { id: "post-1", tags: { t2: { id: "t2" } } } };
    db["posts/post-1/id"] = "post-1";
    db["posts/post-1/tags/t2"] = { id: "t2", extra: true, context: { title: "Old", custom: 1, videoId: "v" } };

    await saveTag("post-1", { ...tag, context: { title: "New" } });

    expect(writeValue).toHaveBeenLastCalledWith("posts/post-1/tags/t2", { ...tag, extra: true, context: { title: "New", custom: 1 } });
  });

  it("merges over nothing", () => {
    expect(mergeEdit(null, { a: 1, b: undefined }, ["b"])).toEqual({ a: 1 });
  });
});
