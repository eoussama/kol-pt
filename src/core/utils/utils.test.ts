import { shortest } from "./array";
import { getImageUrl, getPlaceholderUrl } from "./assets";
import { isContextInvalidated } from "./extension-context";
import { toNumericPostId } from "./post-id";
import { formatDuration, formatShortDuration, formatTimestamp, parseTimestamp } from "./time";



describe("formatTimestamp", () => {
  it.each([
    [0, "0:00:00"],
    [59, "0:00:59"],
    [3725, "1:02:05"],
    [3725.9, "1:02:05"],
    [-5, "0:00:00"],
  ])("formats %d seconds as %s", (seconds, expected) => {
    expect(formatTimestamp(seconds)).toBe(expected);
  });
});

describe("formatDuration", () => {
  it.each([
    [0, "0 seconds"],
    [1, "1 second"],
    [61, "1 minute 1 second"],
    [7322, "2 hours 2 minutes 2 seconds"],
    [3600, "1 hour"],
  ])("formats %d seconds as %s", (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});

describe("formatShortDuration", () => {
  it.each([
    [0, "0s"],
    [-5, "0s"],
    [40.9, "40s"],
    [59, "59s"],
    [60, "1m"],
    [719, "11m"],
    [3599, "59m"],
    [3600, "1h"],
    [3660, "1h 1m"],
    [3900, "1h 5m"],
    [7260, "2h 1m"],
  ])("formats %d seconds as %s", (seconds, expected) => {
    expect(formatShortDuration(seconds)).toBe(expected);
  });
});

describe("bundled images", () => {
  it("finds an image in its folder", () => {
    expect(getImageUrl("imdb", "platforms")).toMatch(/\/images\/platforms\/imdb\.png$/);
    expect(getImageUrl("a", "graphs")).toMatch(/\/images\/graphs\/a\.png$/);
  });

  it("shows the placeholder from the graphs folder", () => {
    expect(getPlaceholderUrl()).toMatch(/\/images\/graphs\/placeholder\.png$/);
  });
});

describe("toNumericPostId", () => {
  it.each([
    ["anime-tonight-4-81910896", "81910896"],
    ["81910896", "81910896"],
    ["no-digits-here", "no-digits-here"],
    ["abc123", "abc123"],
    ["81910896-x", "81910896-x"],
  ])("reads %s as %s", (id, expected) => {
    expect(toNumericPostId(id)).toBe(expected);
  });
});

describe("shortest", () => {
  it("returns the shortest non-empty value without reordering the input", () => {
    const values = ["medium", "", "xs", "longest"];

    expect(shortest(values)).toBe("xs");
    expect(values).toEqual(["medium", "", "xs", "longest"]);
  });

  it("keeps the first of equally short values", () => {
    expect(shortest(["bbb", "aa", "cc"])).toBe("aa");
    expect(shortest(["bb", "aa"])).toBe("bb");
  });

  it("falls back to an empty string by default", () => {
    expect(shortest([])).toBe("");
    expect(shortest([""])).toBe("");
  });

  it("falls back when there is nothing to choose from", () => {
    expect(shortest([], "fallback")).toBe("fallback");
    expect(shortest([""], "fallback")).toBe("fallback");
  });
});

describe("parseTimestamp", () => {
  it.each([
    ["1:02:03", 3723],
    ["2:03", 123],
    ["45", 45],
    [" 0:00:07 ", 7],
    ["1:2:3", 3723],
    ["10:05:30", 36330],
    ["90", 90],
    ["75:30", 4530],
    ["1:30.25", 90.25],
    ["0.5", 0.5],
    ["12.75", 12.75],
  ])("reads %s", (text, expected) => {
    expect(parseTimestamp(text)).toBe(expected);
  });

  it.each(["", "abc", "1:60", "1:60:00", "1::2", "-5", "1:75", "1:75:00", "1.:2", "1:.5", "1.5.5", "1:2.x", "1. 5", "1,5"])("refuses %j", (text) => {
    expect(parseTimestamp(text)).toBeNull();
  });

  it("reads back what it formats", () => {
    expect(parseTimestamp(formatTimestamp(4321))).toBe(4321);
  });
});

describe("isContextInvalidated", () => {
  it("recognizes the error a content script gets once its extension is reloaded", () => {
    expect(isContextInvalidated(new Error("Extension context invalidated."))).toBe(true);
    expect(isContextInvalidated(new Error("Network error"))).toBe(false);
    expect(isContextInvalidated("Extension context invalidated.")).toBe(false);
  });
});
