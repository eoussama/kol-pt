import { fakeBrowser } from "wxt/testing/fake-browser";
import { entriesCacheItem, postsCacheItem } from "../../core/storage/items";
import { readValue } from "../database";
import { getEntries, getPosts, getPostsWithEntries } from "./content";



vi.mock("../database", () => ({ readValue: vi.fn() }));

const MINUTE_MS = 60 * 1000;

const tag = { id: "t1", entryId: "e1", label: "Ep 1", startTime: 0, endTime: 10 };
const storedPosts = [
  { id: "p1", title: "One", creationDate: 5, tags: [tag] },
  { id: "bad", title: "No date" },
];
const storedEntries = [
  { id: "e1", type: 0, title: "Show", altTitles: [] },
  { id: "bad" },
];

const post = { id: "p1", title: "One", description: "", creationDate: 5, thumbnail: "", tags: [{ ...tag, description: "", context: {} }] };
const entry = { id: "e1", type: 0, title: "Show", altTitles: [] };

/**
 * @description
 * Stands in for the database.
 *
 * @param database - The values by path
 */
function stubDatabase(database: Record<string, unknown>): void {
  vi.mocked(readValue).mockImplementation(async path => database[path] ?? null);
}

describe("content repository", () => {
  beforeEach(() => {
    fakeBrowser.reset();
    vi.mocked(readValue).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("validates the posts, dropping malformed ones, and reuses them while fresh", async () => {
    stubDatabase({ posts: storedPosts });

    await expect(getPosts()).resolves.toMatchObject([post]);
    await expect(getPosts()).resolves.toMatchObject([post]);
    expect(readValue).toHaveBeenCalledExactlyOnceWith("posts");
    await expect(postsCacheItem.getValue()).resolves.toMatchObject({ data: [post] });

    await getPosts(true);

    expect(readValue).toHaveBeenCalledTimes(2);
  });

  it("validates the entries, dropping malformed ones, and reuses them while fresh", async () => {
    stubDatabase({ entries: storedEntries });

    await expect(getEntries()).resolves.toMatchObject([entry]);
    await expect(getEntries()).resolves.toMatchObject([entry]);
    expect(readValue).toHaveBeenCalledExactlyOnceWith("entries");

    await getEntries(true);

    expect(readValue).toHaveBeenCalledTimes(2);
  });

  it("answers the posts with their entries without refreshing when none is missing", async () => {
    stubDatabase({ posts: storedPosts, entries: storedEntries });

    await expect(getPostsWithEntries()).resolves.toMatchObject({ posts: [post], entries: [entry] });
    expect(readValue).toHaveBeenCalledTimes(2);
  });

  describe("when a post refers to an entry the cache lacks", () => {
    const newTag = { ...tag, entryId: "e2" };
    const newEntries = [...storedEntries, { id: "e2", type: 0, title: "New", altTitles: [] }];

    /**
     * @description
     * Caches posts and entries that fell out of step, the entries fetched a while ago.
     *
     * @param entriesAgeMs - How long ago the entries were fetched
     * @returns Promise that resolves once cached
     */
    async function cacheOutOfStep(entriesAgeMs: number): Promise<void> {
      await postsCacheItem.setValue({ updatedAt: Date.now(), data: [{ ...post, tags: [{ ...post.tags[0]!, entryId: "e2" }] }] });
      await entriesCacheItem.setValue({ updatedAt: Date.now() - entriesAgeMs, data: [entry] as never });
      stubDatabase({ posts: [{ ...storedPosts[0], tags: [newTag] }], entries: newEntries });
    }

    it("refreshes the entries once they are over ten minutes old", async () => {
      await cacheOutOfStep(11 * MINUTE_MS);

      const result = await getPostsWithEntries();

      expect(result.entries.map(({ id }) => id)).toEqual(["e1", "e2"]);
      expect(readValue).toHaveBeenCalledExactlyOnceWith("entries");
      expect((await entriesCacheItem.getValue())?.data).toHaveLength(2);
    });

    it("refreshes the entries when any reaction of any post is unknown, not only all", async () => {
      await cacheOutOfStep(11 * MINUTE_MS);
      await postsCacheItem.setValue({
        updatedAt: Date.now(),
        data: [
          { ...post, id: "known", tags: [post.tags[0]!] },
          { ...post, id: "mixed", tags: [post.tags[0]!, { ...post.tags[0]!, id: "t2", entryId: "e2" }] },
        ],
      });

      const result = await getPostsWithEntries();

      expect(result.entries.map(({ id }) => id)).toEqual(["e1", "e2"]);
    });

    it("does not refresh old entries when every reaction's entry is known", async () => {
      await entriesCacheItem.setValue({ updatedAt: Date.now() - 11 * MINUTE_MS, data: [entry] as never });
      await postsCacheItem.setValue({ updatedAt: Date.now(), data: [post] });

      const result = await getPostsWithEntries();

      expect(result.entries.map(({ id }) => id)).toEqual(["e1"]);
      expect(readValue).not.toHaveBeenCalled();
    });

    it("refreshes only after more than ten minutes, not at ten", async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(1_000_000_000_000);

      try {
        await cacheOutOfStep(10 * MINUTE_MS);
        await expect(getPostsWithEntries()).resolves.toMatchObject({ entries: [entry] });
        expect(readValue).not.toHaveBeenCalled();

        vi.setSystemTime(1_000_000_000_000 + 1);
        await expect(getPostsWithEntries()).resolves.toMatchObject({ entries: [entry, { id: "e2" }] });
        expect(readValue).toHaveBeenCalledExactlyOnceWith("entries");
      }
      finally {
        vi.useRealTimers();
      }
    });

    it("leaves recently fetched entries alone, as the post may point to nothing", async () => {
      await cacheOutOfStep(9 * MINUTE_MS);

      const result = await getPostsWithEntries();

      expect(result.entries.map(({ id }) => id)).toEqual(["e1"]);
      expect(readValue).not.toHaveBeenCalled();
    });

    it("loads the entries only once when forced", async () => {
      await cacheOutOfStep(11 * MINUTE_MS);
      stubDatabase({ posts: [{ ...storedPosts[0], tags: [newTag] }], entries: storedEntries });

      const result = await getPostsWithEntries(true);

      expect(result.entries.map(({ id }) => id)).toEqual(["e1"]);
      expect(vi.mocked(readValue).mock.calls.filter(([path]) => path === "entries")).toHaveLength(1);
    });

    it("refreshes when the entries' age is lost", async () => {
      await cacheOutOfStep(0);

      const current = await entriesCacheItem.getValue();

      vi.spyOn(entriesCacheItem, "getValue").mockResolvedValueOnce(current).mockResolvedValueOnce(null);

      const result = await getPostsWithEntries();

      expect(result.entries.map(({ id }) => id)).toEqual(["e1", "e2"]);
    });
  });
});
