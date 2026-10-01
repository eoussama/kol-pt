import { readWatchlist, toDatabaseKey, watchlistKey } from "./watchlist";



describe("watchlist keys", () => {
  it("identifies a reaction by post and tag", () => {
    expect(watchlistKey("171089353", "t1")).toBe("171089353/t1");
  });

  it("replaces characters the database does not allow in keys", () => {
    expect(toDatabaseKey("a.b#c$d/e[f]g")).toBe("a_b_c_d_e_f_g");
  });
});

describe("readWatchlist", () => {
  it("lists the reactions marked as watched", () => {
    const stored = { 171089353: { t1: true, t2: true, t3: false }, 170879619: { t9: true } };

    expect(readWatchlist(stored).sort()).toEqual(["170879619/t9", "171089353/t1", "171089353/t2"]);
  });

  it("reads tags the database SDK returned as an array", () => {
    // { 171089353: { 1: true, 3: true } } comes back with the tags as an array
    // eslint-disable-next-line no-sparse-arrays
    expect(readWatchlist({ 171089353: [, true, , true] })).toEqual(["171089353/1", "171089353/3"]);
  });

  it.each([null, undefined, "x", ["t1", "t2"], { 1: "not a map" }])("reads %j as empty", (value) => {
    expect(readWatchlist(value)).toEqual([]);
  });
});
