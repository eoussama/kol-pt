import type { TPost } from "../core/schemas/post.schema";

import { act, renderHook, waitFor } from "@testing-library/react";
import { request } from "../core/messaging/client";
import { usePostStore } from "../state/posts.state";
import { usePosts } from "./posts.hook";



vi.mock("../core/messaging/client", () => ({ request: vi.fn() }));

const requestMock = vi.mocked(request);

const posts: Array<TPost> = [
  { id: "p1", title: "Anime Tonight", description: "", thumbnail: "", creationDate: 1000, tags: [] },
  { id: "p2", title: "Movie Night", description: "", thumbnail: "", creationDate: 2000, tags: [] },
];

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

describe("usePosts", () => {
  beforeEach(() => {
    requestMock.mockReset();
    requestMock.mockResolvedValue({ posts, entries: [] });
    usePostStore.setState({ posts: [], error: false, loading: false });
  });

  it("loads the posts when shown, newest first", async () => {
    const { result } = renderHook(() => usePosts());

    await waitFor(() => expect(result.current.posts.map(p => p.id)).toEqual(["p2", "p1"]));
    expect(requestMock).toHaveBeenCalledExactlyOnceWith("posts.list", { force: false });
    expect(result.current.postsCount).toBe(2);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(false);
    expect(result.current.search).toBe("");
  });

  it("is loading until the posts are in", async () => {
    const { result } = renderHook(() => usePosts());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("filters the posts by what is typed, ignoring case, and still counts them all", async () => {
    const { result } = renderHook(() => usePosts());

    await waitFor(() => expect(result.current.postsCount).toBe(2));

    act(() => result.current.onSearch(type("MOVIE")));

    expect(result.current.search).toBe("movie");
    expect(result.current.posts.map(p => p.id)).toEqual(["p2"]);
    expect(result.current.postsCount).toBe(2);
  });

  it("lists everything again when the search has no text", async () => {
    const { result } = renderHook(() => usePosts());

    await waitFor(() => expect(result.current.postsCount).toBe(2));

    act(() => result.current.onSearch(type("movie")));
    act(() => result.current.onSearch(type(undefined)));

    expect(result.current.search).toBe("");
    expect(result.current.posts).toHaveLength(2);
  });

  it("reports an error when the posts cannot be loaded", async () => {
    requestMock.mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => usePosts());

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.posts).toEqual([]);
  });
});
