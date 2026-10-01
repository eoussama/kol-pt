import { fakeBrowser } from "wxt/testing/fake-browser";
import { watchlistItem } from "../../core/storage/items";
import { readValue, updateValues } from "../database";
import { clearWatchlist, loadWatchlist, setWatched } from "./watchlist";



vi.mock("../database", () => ({
  readValue: vi.fn(),
  updateValues: vi.fn(async () => undefined),
}));

describe("watchlist repository", () => {
  beforeEach(() => {
    fakeBrowser.reset();
    vi.mocked(updateValues).mockClear();
  });

  it("loads the user's watchlist into storage", async () => {
    vi.mocked(readValue).mockResolvedValue({ p1: { t1: true } });

    await expect(loadWatchlist("u1")).resolves.toEqual(["p1/t1"]);
    await expect(watchlistItem.getValue()).resolves.toEqual({ uid: "u1", keys: ["p1/t1"] });
    expect(readValue).toHaveBeenCalledWith("users/u1/watchlist");
  });

  it("writes only the toggled reaction", async () => {
    await setWatched("u1", "p1", "t1", true);
    await setWatched("u1", "p1", "t2", false);

    expect(updateValues).toHaveBeenNthCalledWith(1, "users/u1/watchlist", { "p1/t1": true });
    expect(updateValues).toHaveBeenNthCalledWith(2, "users/u1/watchlist", { "p1/t2": null });
  });

  it("does not lose concurrent toggles", async () => {
    await Promise.all([
      setWatched("u1", "p1", "t1", true),
      setWatched("u1", "p1", "t2", true),
      setWatched("u1", "p2", "t3", true),
    ]);

    const stored = await watchlistItem.getValue();

    expect(stored?.keys.sort()).toEqual(["p1/t1", "p1/t2", "p2/t3"]);
  });

  it("does not mix users' watchlists", async () => {
    await watchlistItem.setValue({ uid: "someone-else", keys: ["p9/t9"] });
    await setWatched("u1", "p1", "t1", true);

    await expect(watchlistItem.getValue()).resolves.toEqual({ uid: "u1", keys: ["p1/t1"] });
  });

  it("forgets the watchlist on sign out", async () => {
    await watchlistItem.setValue({ uid: "u1", keys: ["p1/t1"] });
    await clearWatchlist();

    await expect(watchlistItem.getValue()).resolves.toBeNull();
  });
});
