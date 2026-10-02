import { Tag } from "../domain/tag";
import { findReactionAt, readProgress } from "./progress";



function tag(id: string, startTime: number, endTime: number): Tag {
  return new Tag({ id, entryId: "e1", label: id, description: "", startTime, endTime, context: {} }, null);
}

describe("readProgress", () => {
  it("reads saved positions and drops malformed ones", () => {
    expect(readProgress({
      "post-1": { time: 120, updatedAt: 1000 },
      "post-2": { time: "120", updatedAt: 1000 },
      "post-3": { time: -1, updatedAt: 1000 },
      "post-4": true,
    })).toEqual({ "post-1": { time: 120, updatedAt: 1000 } });
  });

  it("reads arrays by index and anything else as empty", () => {
    expect(readProgress([undefined, { time: 5, updatedAt: 1 }])).toEqual({ 1: { time: 5, updatedAt: 1 } });
    expect(readProgress(null)).toEqual({});
    expect(readProgress("x")).toEqual({});
  });
});

describe("findReactionAt", () => {
  const tags = [tag("b", 300, 400), tag("a", 100, 200)];

  it("finds the reaction playing at a position", () => {
    expect(findReactionAt(tags, 150)?.id).toBe("a");
    expect(findReactionAt(tags, 300)?.id).toBe("b");
  });

  it("falls back to the last reaction started, then the first", () => {
    expect(findReactionAt(tags, 250)?.id).toBe("a");
    expect(findReactionAt(tags, 500)?.id).toBe("b");
    expect(findReactionAt(tags, 20)?.id).toBe("a");
    expect(findReactionAt([], 20)).toBeNull();
  });
});
