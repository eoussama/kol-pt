import { shortest } from "./array";
import { formatDuration, formatTimestamp, parseTimestamp } from "./time";



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

describe("shortest", () => {
  it("returns the shortest non-empty value without reordering the input", () => {
    const values = ["medium", "", "xs", "longest"];

    expect(shortest(values)).toBe("xs");
    expect(values).toEqual(["medium", "", "xs", "longest"]);
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
  ])("reads %s", (text, expected) => {
    expect(parseTimestamp(text)).toBe(expected);
  });

  it.each(["", "abc", "1:60", "1:60:00", "1::2", "-5"])("refuses %j", (text) => {
    expect(parseTimestamp(text)).toBeNull();
  });

  it("reads back what it formats", () => {
    expect(parseTimestamp(formatTimestamp(4321))).toBe(4321);
  });
});
