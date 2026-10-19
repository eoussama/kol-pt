import type { TEntry } from "../core/schemas/entry/entry.schema";
import type { TPost } from "../core/schemas/post.schema";

import { Anime } from "../core/domain/anime";
import { EEntryType } from "../core/enums/entry-type.enum";
import { request } from "../core/messaging/client";
import { usePostStore } from "./posts.state";



vi.mock("../core/messaging/client", () => ({ request: vi.fn() }));

const requestMock = vi.mocked(request);

const tag = { id: "t1", entryId: "e1", label: "1", description: "", startTime: 0, endTime: 60, context: {} };
const entries: Array<TEntry> = [{ id: "e1", title: "Frieren", type: EEntryType.ANIME, malId: 1, altTitles: [] }];
const posts = [
  { id: "old", title: "Old", description: "", thumbnail: "", creationDate: 1000, tags: [tag] },
  { id: "new", title: "New", description: "", thumbnail: "", creationDate: 2000, tags: [] },
] as Array<TPost>;

describe("posts store", () => {
  beforeEach(() => {
    requestMock.mockReset();
    usePostStore.setState({ posts: [], error: false, loading: false });
  });

  it("starts with no posts, no error, and nothing loading", () => {
    expect(usePostStore.getInitialState()).toMatchObject({ posts: [], error: false, loading: false });
  });

  it("loads the posts newest first, joined to their entries, allowing the cache by default", async () => {
    requestMock.mockResolvedValue({ posts, entries });

    await usePostStore.getState().loadPosts();

    const state = usePostStore.getState();

    expect(requestMock).toHaveBeenCalledExactlyOnceWith("posts.list", { force: false });
    expect(state.posts.map(p => p.id)).toEqual(["new", "old"]);
    expect(state.posts[1]?.tags[0]?.entry).toBeInstanceOf(Anime);
    expect(state.error).toBe(false);
    expect(state.loading).toBe(false);
  });

  it("forces a fresh load when the cache is skipped", async () => {
    requestMock.mockResolvedValue({ posts: [], entries: [] });

    await usePostStore.getState().loadPosts(false);

    expect(requestMock).toHaveBeenCalledWith("posts.list", { force: true });
  });

  it("shows it is loading only while nothing is shown yet", async () => {
    let resolve: (value: { posts: Array<TPost>; entries: Array<TEntry> }) => void = () => undefined;

    requestMock.mockImplementation(() => new Promise((r) => {
      resolve = r as typeof resolve;
    }));

    const first = usePostStore.getState().loadPosts();

    expect(usePostStore.getState().loading).toBe(true);
    resolve({ posts, entries });
    await first;
    expect(usePostStore.getState().loading).toBe(false);

    const reload = usePostStore.getState().loadPosts();

    expect(usePostStore.getState().loading).toBe(false);
    expect(usePostStore.getState().posts).toHaveLength(2);
    resolve({ posts: [], entries: [] });
    await reload;
    expect(usePostStore.getState().posts).toEqual([]);
  });

  it("flags the error, and stops loading, when the load fails; the next load clears it", async () => {
    requestMock.mockRejectedValueOnce(new Error("offline"));

    await usePostStore.getState().loadPosts();
    expect(usePostStore.getState()).toMatchObject({ error: true, loading: false, posts: [] });

    requestMock.mockResolvedValueOnce({ posts, entries });
    await usePostStore.getState().loadPosts();
    expect(usePostStore.getState().error).toBe(false);
  });
});
