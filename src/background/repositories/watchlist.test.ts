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
    await expect(watchlistItem.getValue()).resolves.toEqual({ uid: "u1", keys: ["p1/t1"], watchedAt: {} });
    expect(readValue).toHaveBeenCalledWith("users/u1/watchlist");
  });

  it("loads when reactions were watched", async () => {
    vi.mocked(readValue).mockResolvedValue({ p1: { t1: 1700000000000, t2: true } });

    await loadWatchlist("u1");

    await expect(watchlistItem.getValue()).resolves.toEqual({ uid: "u1", keys: ["p1/t1", "p1/t2"], watchedAt: { "p1/t1": 1700000000000 } });
  });

  it("writes only the toggled reaction", async () => {
    await setWatched("u1", "p1", "t1", true, () => 1234);
    await setWatched("u1", "p1", "t2", false);

    expect(updateValues).toHaveBeenNthCalledWith(1, "users/u1/watchlist", { "p1/t1": 1234 });
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
    vi.mocked(readValue).mockResolvedValue(null);
    await watchlistItem.setValue({ uid: "someone-else", keys: ["p9/t9"] });
    await setWatched("u1", "p1", "t1", true);

    await expect(watchlistItem.getValue()).resolves.toMatchObject({ uid: "u1", keys: ["p1/t1"] });
  });

  it("records when a reaction was watched and keeps older reactions' dates", async () => {
    await watchlistItem.setValue({ uid: "u1", keys: ["p1/t1", "p1/t2"], watchedAt: { "p1/t1": 100 } });

    await setWatched("u1", "p2", "t3", true, () => 500);

    await expect(watchlistItem.getValue()).resolves.toEqual({ uid: "u1", keys: ["p1/t1", "p1/t2", "p2/t3"], watchedAt: { "p1/t1": 100, "p2/t3": 500 } });

    await setWatched("u1", "p1", "t1", false);

    await expect(watchlistItem.getValue()).resolves.toEqual({ uid: "u1", keys: ["p1/t2", "p2/t3"], watchedAt: { "p2/t3": 500 } });
  });

  it("keeps the user's other watched reactions when storage lost them", async () => {
    vi.mocked(readValue).mockResolvedValue({ p1: { t1: true, t2: true } });
    await setWatched("u1", "p2", "t3", true);

    expect((await watchlistItem.getValue())?.keys.sort()).toEqual(["p1/t1", "p1/t2", "p2/t3"]);
  });

  it("forgets the watchlist on sign out", async () => {
    await watchlistItem.setValue({ uid: "u1", keys: ["p1/t1"] });
    await clearWatchlist();

    await expect(watchlistItem.getValue()).resolves.toBeNull();
  });
});
