import type { TEntry } from "../core/schemas/entry/entry.schema";
import type { TPost } from "../core/schemas/post.schema";

import { act, renderHook, waitFor } from "@testing-library/react";
import { hydratePosts } from "../core/domain/hydrate";
import { EEntryType } from "../core/enums/entry-type.enum";
import { request } from "../core/messaging/client";
import { useFavoritesStore } from "../state/favorites.state";
import { usePostStore } from "../state/posts.state";
import { useProgressStore } from "../state/progress.state";
import { useWatchlistStore } from "../state/watchlist.state";
import { buildContinueList, buildHistory, describeLeft, useHistory } from "./history.hook";



vi.mock("../core/messaging/client", () => ({ request: vi.fn() }));

const requestMock = vi.mocked(request);

function tag(id: string, startTime = 0, endTime = 60) {
  return { id, entryId: "e1", label: id, description: "", startTime, endTime, context: {} };
}

const posts = hydratePosts([
  { id: "old-post-1", title: "Old", description: "", thumbnail: "", creationDate: 1000, tags: [tag("t1"), tag("t2")] },
  { id: "new-post-2", title: "New", description: "", thumbnail: "", creationDate: 2000, tags: [tag("t3"), tag("t4")] },
] as Array<TPost>, []);

describe("buildHistory", () => {
  it("lists marked reactions, most recently marked first, undated ones last", () => {
    const watched = new Map([["old-post-1", new Set(["t1", "t2"])], ["new-post-2", new Set(["t3"])]]);
    const watchedAt = new Map([["old-post-1/t2", 500], ["new-post-2/t3", 300]]);

    const history = buildHistory(posts, watched, watchedAt);

    expect(history.map(item => `${item.post.id}/${item.tag.id}`)).toEqual(["old-post-1/t2", "new-post-2/t3", "old-post-1/t1"]);
    expect(history[0]?.markedAt?.getTime()).toBe(500);
    expect(history[2]?.markedAt).toBeNull();
  });

  it("ranks a reaction marked at the very start of time above undated ones", () => {
    const watched = new Map([["old-post-1", new Set(["t1", "t2"])]]);

    const history = buildHistory(posts, watched, new Map([["old-post-1/t2", 0]]));

    expect(history.map(item => item.tag.id)).toEqual(["t2", "t1"]);
  });

  it("is empty when nothing is watched", () => {
    expect(buildHistory(posts, new Map(), new Map())).toEqual([]);
  });

  it("looks marks up by database keys", () => {
    const [dotted] = hydratePosts([{ id: "a.b", title: "Dotted", description: "", thumbnail: "", creationDate: 0, tags: [tag("t.1"), tag("t2")] }] as Array<TPost>, []);

    const history = buildHistory([dotted!], new Map([["a_b", new Set(["t_1"])]]), new Map([["a_b/t_1", 9]]));

    expect(history.map(item => item.tag.id)).toEqual(["t.1"]);
    expect(history[0]?.markedAt?.getTime()).toBe(9);
  });
});

describe("buildContinueList", () => {
  it("lists posts with a saved position, most recently watched first, with the reaction stopped in", () => {
    const progress = new Map([["old-post-1", { time: 30, updatedAt: 100 }], ["new-post-2", { time: 10, updatedAt: 50 }]]);

    const items = buildContinueList(posts, progress);

    expect(items.map(item => [item.post.id, item.tag.id, item.resumeAt])).toEqual([["old-post-1", "t1", 30], ["new-post-2", "t3", 10]]);
    expect(items[0]?.markedAt?.getTime()).toBe(100);
  });

  it("skips posts without a saved position, and posts without reactions", () => {
    const [empty] = hydratePosts([{ id: "empty", title: "Empty", description: "", thumbnail: "", creationDate: 0, tags: [] }] as Array<TPost>, []);
    const progress = new Map([["empty", { time: 30, updatedAt: 1 }]]);

    expect(buildContinueList([empty!], progress)).toEqual([]);
    expect(buildContinueList(posts, new Map())).toEqual([]);
  });

  it("looks positions up by the post's database key", () => {
    const [dotted] = hydratePosts([{ id: "a.b", title: "Dotted", description: "", thumbnail: "", creationDate: 0, tags: [tag("t1")] }] as Array<TPost>, []);

    expect(buildContinueList([dotted!], new Map([["a_b", { time: 5, updatedAt: 1 }]])).map(item => item.post.id)).toEqual(["a.b"]);
  });

  it("counts the time left from the start of the reaction when stopped before it", () => {
    const [post] = hydratePosts([{ id: "p", title: "P", description: "", thumbnail: "", creationDate: 0, tags: [tag("a", 100, 160)] }] as Array<TPost>, []);

    expect(buildContinueList([post!], new Map([["p", { time: 40, updatedAt: 0 }]]))[0]?.left).toEqual({ reaction: 60, post: 120 });
  });
});

describe("time left to continue", () => {
  it("counts what is left of the reaction and of the post", () => {
    const [post] = hydratePosts([{ id: "p", title: "P", description: "", thumbnail: "", creationDate: 0, tags: [tag("a", 0, 600), tag("b", 700, 4300)] }] as Array<TPost>, []);

    const left = (time: number) => buildContinueList([post!], new Map([["p", { time, updatedAt: 0 }]]))[0]?.left;

    expect(left(100)).toEqual({ reaction: 500, post: 4200 });
    expect(left(650)).toEqual({ reaction: 0, post: 3650 });
    expect(left(5000)).toEqual({ reaction: 0, post: 0 });
  });

  it("describes it", () => {
    expect(describeLeft({ reaction: 500, post: 4200 })).toBe("8m left in this reaction · 1h 10m in the post");
    expect(describeLeft({ reaction: 0, post: 3650 })).toBe("1h left");
    expect(describeLeft({ reaction: 40, post: 40 })).toBe("40s left");
    expect(describeLeft({ reaction: 0, post: 0 })).toBe("Finished");
  });
});

describe("useHistory", () => {
  const entries: Array<TEntry> = [
    { id: "e1", title: "Frieren", type: EEntryType.ANIME, malId: 1, altTitles: [] },
    { id: "e2", title: "Severance", type: EEntryType.TV_SHOW, altTitles: [] },
  ];
  const stored = [
    { id: "old-post-1", title: "Old Post", description: "", thumbnail: "", creationDate: 1000, tags: [tag("t1"), { ...tag("t2"), entryId: "missing", label: "Mystery" }] },
    { id: "new-post-2", title: "New Post", description: "", thumbnail: "", creationDate: 2000, tags: [{ ...tag("t3"), entryId: "e2" }] },
  ] as Array<TPost>;

  /**
   * @description
   * A change event of a search input.
   *
   * @param value - What was typed
   * @returns The event
   */
  function type(value: string | undefined) {
    return { target: { value } } as React.ChangeEvent<HTMLInputElement>;
  }

  /**
   * @description
   * Lists the items as `<post>/<reaction>`.
   *
   * @param items - The history items
   * @returns Their IDs
   */
  const ids = (items: Array<{ post: { id: string }; tag: { id: string } }>) => items.map(item => `${item.post.id}/${item.tag.id}`);

  beforeEach(() => {
    requestMock.mockReset();
    requestMock.mockResolvedValue({ posts: stored, entries });
    usePostStore.setState({ posts: [], error: false, loading: false });
    useWatchlistStore.setState({ posts: new Map([["old-post-1", new Set(["t1", "t2"])], ["new-post-2", new Set(["t3"])]]), markedAt: new Map([["new-post-2/t3", 10]]) });
    useFavoritesStore.setState({ posts: new Map([["new-post-2", new Set(["t3"])]]), markedAt: new Map([["new-post-2/t3", 20]]) });
    useProgressStore.setState({ posts: new Map([["old-post-1", { time: 10, updatedAt: 5 }]]) });
  });

  it("loads the posts and lists the watched reactions, most recently watched first", async () => {
    const { result } = renderHook(() => useHistory("watched"));

    await waitFor(() => expect(result.current.history).toHaveLength(3));

    expect(requestMock).toHaveBeenCalledExactlyOnceWith("posts.list", { force: false });
    expect(ids(result.current.history)).toEqual(["new-post-2/t3", "old-post-1/t1", "old-post-1/t2"]);
    expect(result.current.historyCount).toBe(3);
    expect(result.current.search).toBe("");
  });

  it("lists the favorites", async () => {
    const { result } = renderHook(() => useHistory("favorites"));

    await waitFor(() => expect(ids(result.current.history)).toEqual(["new-post-2/t3"]));
    expect(result.current.history[0]?.markedAt?.getTime()).toBe(20);
  });

  it("lists the posts to continue", async () => {
    const { result } = renderHook(() => useHistory("continue"));

    await waitFor(() => expect(ids(result.current.history)).toEqual(["old-post-1/t1"]));
    expect(result.current.history[0]?.resumeAt).toBe(10);
  });

  it("is loading until the posts are in", async () => {
    const { result } = renderHook(() => useHistory("watched"));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("reports an error when the posts cannot be loaded", async () => {
    requestMock.mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => useHistory("watched"));

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.history).toEqual([]);
  });

  it("filters by the entry, the post or the reaction, ignoring case, and still counts them all", async () => {
    const { result } = renderHook(() => useHistory("watched"));

    await waitFor(() => expect(result.current.historyCount).toBe(3));

    act(() => result.current.onSearch(type("SEVERANCE")));
    expect(result.current.search).toBe("severance");
    expect(ids(result.current.history)).toEqual(["new-post-2/t3"]);

    act(() => result.current.onSearch(type("old post")));
    expect(ids(result.current.history)).toEqual(["old-post-1/t1", "old-post-1/t2"]);

    act(() => result.current.onSearch(type("Mystery")));
    expect(ids(result.current.history)).toEqual(["old-post-1/t1", "old-post-1/t2"]);

    act(() => result.current.onSearch(type("nothing like it")));
    expect(result.current.history).toEqual([]);
    expect(result.current.historyCount).toBe(3);
  });

  it("lists everything again when the search has no text", async () => {
    const { result } = renderHook(() => useHistory("watched"));

    await waitFor(() => expect(result.current.historyCount).toBe(3));

    act(() => result.current.onSearch(type("mystery")));
    act(() => result.current.onSearch(type(undefined)));

    expect(result.current.search).toBe("");
    expect(result.current.history).toHaveLength(3);
  });

  it("follows what the user marks", async () => {
    const { result } = renderHook(() => useHistory("watched"));

    await waitFor(() => expect(result.current.historyCount).toBe(3));

    act(() => useWatchlistStore.getState().setKeys(["old-post-1/t1"]));
    expect(ids(result.current.history)).toEqual(["old-post-1/t1"]);
  });
});
