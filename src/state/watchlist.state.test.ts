import { request } from "../core/messaging/client";
import { useWatchlistStore } from "./watchlist.state";



vi.mock("../core/messaging/client", () => ({ request: vi.fn() }));

const requestMock = vi.mocked(request);

function stored(postId: string): Array<string> {
  return [...(useWatchlistStore.getState().posts.get(postId) ?? [])];
}

describe("watchlist store", () => {
  beforeEach(() => {
    requestMock.mockReset();
    useWatchlistStore.setState({ posts: new Map(), saving: new Map() });
  });

  it("keeps a separate watchlist per post", () => {
    useWatchlistStore.getState().setKeys(["p1/t1", "p1/t2", "p2/t1"]);

    expect(stored("p1")).toEqual(["t1", "t2"]);
    expect(stored("p2")).toEqual(["t1"]);
    expect(stored("p3")).toEqual([]);
  });

  it("waits for the save: the checkbox does not change until it is confirmed", async () => {
    let resolve: (keys: Array<string>) => void = () => undefined;

    requestMock.mockReturnValue(new Promise((r) => {
      resolve = r as typeof resolve;
    }));

    const toggling = useWatchlistStore.getState().toggle("p1", "t1", true);

    expect(stored("p1")).toEqual([]);
    expect(useWatchlistStore.getState().saving.get("p1")).toBe("t1");

    resolve(["p1/t1"]);

    await expect(toggling).resolves.toBe(true);
    expect(stored("p1")).toEqual(["t1"]);
    expect(useWatchlistStore.getState().saving.size).toBe(0);
    expect(requestMock).toHaveBeenCalledWith("watchlist.set", { postId: "p1", tagId: "t1", watched: true });
  });

  it("halts changes to a post while one is being saved", async () => {
    requestMock.mockReturnValue(new Promise(() => undefined));
    useWatchlistStore.getState().toggle("p1", "t1", true);

    await expect(useWatchlistStore.getState().toggle("p1", "t2", true)).resolves.toBe(false);
    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  it("does not halt other posts", async () => {
    requestMock.mockReturnValueOnce(new Promise(() => undefined));
    requestMock.mockResolvedValueOnce(["p2/t1"]);
    useWatchlistStore.getState().toggle("p1", "t1", true);

    await expect(useWatchlistStore.getState().toggle("p2", "t1", true)).resolves.toBe(true);
    expect(stored("p2")).toEqual(["t1"]);
  });

  it("leaves the checkbox as stored, and unlocks the post, if saving fails", async () => {
    useWatchlistStore.getState().setKeys(["p1/t1"]);
    requestMock.mockRejectedValue(new Error("Not signed in"));

    await expect(useWatchlistStore.getState().toggle("p1", "t1", false)).resolves.toBe(false);

    expect(stored("p1")).toEqual(["t1"]);
    expect(useWatchlistStore.getState().saving.size).toBe(0);
  });
});
