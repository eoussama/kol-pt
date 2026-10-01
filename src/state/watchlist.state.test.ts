import { request } from "../core/messaging/client";
import { useWatchlistStore } from "./watchlist.state";



vi.mock("../core/messaging/client", () => ({ request: vi.fn() }));

const requestMock = vi.mocked(request);

function isWatched(key: string): boolean {
  const { pending, keys } = useWatchlistStore.getState();

  return pending.get(key) ?? keys.has(key);
}

describe("watchlist store", () => {
  beforeEach(() => {
    requestMock.mockReset();
    useWatchlistStore.setState({ keys: new Set(), pending: new Map() });
  });

  it("shows a change immediately and keeps it once saved", async () => {
    let resolve: (keys: Array<string>) => void = () => undefined;

    requestMock.mockReturnValue(new Promise((r) => {
      resolve = r as typeof resolve;
    }));

    const toggling = useWatchlistStore.getState().toggle("p1", "t1", true);

    expect(isWatched("p1/t1")).toBe(true);

    resolve(["p1/t1"]);
    await toggling;

    expect(isWatched("p1/t1")).toBe(true);
    expect(useWatchlistStore.getState().pending.size).toBe(0);
    expect(requestMock).toHaveBeenCalledWith("watchlist.set", { postId: "p1", tagId: "t1", watched: true });
  });

  it("keeps the latest choice when a reaction is toggled twice quickly", async () => {
    const responses: Array<(keys: Array<string>) => void> = [];

    requestMock.mockImplementation(() => new Promise((resolve) => {
      responses.push(resolve as (keys: Array<string>) => void);
    }));

    const first = useWatchlistStore.getState().toggle("p1", "t1", true);
    const second = useWatchlistStore.getState().toggle("p1", "t1", false);

    responses[0]?.(["p1/t1"]);
    await first;

    expect(isWatched("p1/t1")).toBe(false);

    responses[1]?.([]);
    await second;

    expect(isWatched("p1/t1")).toBe(false);
  });

  it("rolls the change back if saving fails", async () => {
    useWatchlistStore.getState().setKeys(["p1/t1"]);
    requestMock.mockRejectedValue(new Error("Not signed in"));

    await useWatchlistStore.getState().toggle("p1", "t1", false);

    expect(isWatched("p1/t1")).toBe(true);
    expect(useWatchlistStore.getState().pending.size).toBe(0);
  });
});
