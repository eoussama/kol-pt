import type { TPost } from "../core/schemas/post.schema";

import { hydratePosts } from "../core/domain/hydrate";
import { buildContinueList, buildHistory } from "./history.hook";



function tag(id: string) {
  return { id, entryId: "e1", label: id, description: "", startTime: 0, endTime: 60, context: {} };
}

const posts = hydratePosts([
  { id: "old-post-1", title: "Old", description: "", thumbnail: "", creationDate: 1000, tags: [tag("t1"), tag("t2")] },
  { id: "new-post-2", title: "New", description: "", thumbnail: "", creationDate: 2000, tags: [tag("t3"), tag("t4")] },
] as Array<TPost>, []);

describe("buildHistory", () => {
  it("lists marked reactions, most recently marked first, undated ones last", () => {
    const watched = new Map([["old-post-1", new Set(["t1", "t2"])], ["new-post-2", new Set(["t3"])]]);
    const watchedAt = new Map([["old-post-1/t2", 500], ["new-post-2/t3", 300]]);

    const history = buildHistory(posts, watched, watchedAt);

    expect(history.map(item => `${item.post.id}/${item.tag.id}`)).toEqual(["old-post-1/t2", "new-post-2/t3", "old-post-1/t1"]);
    expect(history[0]?.markedAt?.getTime()).toBe(500);
    expect(history[2]?.markedAt).toBeNull();
  });

  it("is empty when nothing is watched", () => {
    expect(buildHistory(posts, new Map(), new Map())).toEqual([]);
  });
});

describe("buildContinueList", () => {
  it("lists posts with a saved position, most recently watched first, with the reaction stopped in", () => {
    const progress = new Map([["old-post-1", { time: 30, updatedAt: 100 }], ["new-post-2", { time: 10, updatedAt: 50 }]]);

    const items = buildContinueList(posts, progress);

    expect(items.map(item => [item.post.id, item.tag.id, item.resumeAt])).toEqual([["old-post-1", "t1", 30], ["new-post-2", "t3", 10]]);
    expect(items[0]?.markedAt?.getTime()).toBe(100);
  });
});
