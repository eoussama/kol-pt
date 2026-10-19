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

  it("keeps a position at the very start, and drops times that are not finite numbers", () => {
    expect(readProgress({
      "post-1": { time: 0, updatedAt: 1000 },
      "post-2": { time: Number.POSITIVE_INFINITY, updatedAt: 1000 },
      "post-3": { time: Number.NaN, updatedAt: 1000 },
      "post-4": { time: 5 },
      "post-5": { time: 5, updatedAt: Number.POSITIVE_INFINITY },
      "post-6": { time: 5, updatedAt: "1000" },
      "post-7": null,
    })).toEqual({ "post-1": { time: 0, updatedAt: 1000 } });
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

  it("prefers the reaction playing over one that started later", () => {
    const overlapping = [tag("long", 0, 100), tag("short", 10, 20)];

    expect(findReactionAt(overlapping, 50)?.id).toBe("long");
    expect(findReactionAt(overlapping, 15)?.id).toBe("long");
  });

  it("counts a reaction as playing from its start up to, not including, its end", () => {
    expect(findReactionAt([tag("x", 10, 20), tag("y", 0, 12)], 10)?.id).toBe("x");
    expect(findReactionAt([tag("p", 0, 10), tag("q", 10, 20)], 10)?.id).toBe("q");
    expect(findReactionAt([tag("p", 0, 10), tag("q", 12, 20)], 15)?.id).toBe("q");
    expect(findReactionAt([tag("p", 0, 10), tag("q", 12, 20)], 10)?.id).toBe("p");
  });

  it("falls back to the latest reaction started, whatever the order", () => {
    const [a, b, c] = [tag("a", 0, 1), tag("b", 2, 3), tag("c", 4, 5)] as [Tag, Tag, Tag];

    for (const order of [[a, b, c], [c, b, a], [b, c, a], [a, c, b]]) {
      expect(findReactionAt(order, 10)?.id).toBe("c");
    }
  });

  it("falls back to the earliest reaction, whatever the order, when none has started", () => {
    const [a, b, c] = [tag("a", 10, 11), tag("b", 12, 13), tag("c", 14, 15)] as [Tag, Tag, Tag];

    for (const order of [[a, b, c], [c, b, a], [b, c, a], [c, a, b]]) {
      expect(findReactionAt(order, 1)?.id).toBe("a");
    }
  });

  it("counts a reaction that ended instantly as started", () => {
    expect(findReactionAt([tag("a", 0, 5), tag("z", 10, 10)], 10)?.id).toBe("z");
  });

  it("falls back to the last reaction started, then the first", () => {
    expect(findReactionAt(tags, 250)?.id).toBe("a");
    expect(findReactionAt(tags, 500)?.id).toBe("b");
    expect(findReactionAt(tags, 20)?.id).toBe("a");
    expect(findReactionAt([], 20)).toBeNull();
  });
});
