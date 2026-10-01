import type { TEntry } from "../schemas/entry/entry.schema";
import type { TPost } from "../schemas/post.schema";

import { EEntryType } from "../enums/entry-type.enum";
import { Anime } from "./anime";
import { createEntry, findReactions, hydratePosts } from "./hydrate";
import { YouTube } from "./youtube";



function tag(id: string, entryId: string, startTime: number, context: Record<string, unknown> = {}) {
  return { id, entryId, label: "3", description: "", startTime, endTime: startTime + 60, context };
}

const entries: Array<TEntry> = [
  { id: "e1", title: "Clevatess", type: EEntryType.ANIME, malId: 57891, altTitles: ["Clevatess: Majuu no Ou", "Clev"] },
  { id: "e2", title: "Some Channel", type: EEntryType.YOUTUBE, handle: "somechannel", channelId: "UC1", altTitles: [] },
];

const posts: Array<TPost> = [
  { id: "p1", title: "Older", description: "", thumbnail: "", creationDate: 1000, tags: [tag("t2", "e1", 900), tag("t1", "e1", 100)] },
  { id: "p2", title: "Newer", description: "", thumbnail: "", creationDate: 2000, tags: [tag("t3", "e2", 50, { altTitles: ["Long video title", "Short"] }), tag("t4", "missing", 10)] },
];

describe("hydratePosts", () => {
  it("joins tags to their entries", () => {
    const [newer, older] = hydratePosts(posts, entries);

    expect(older?.tags[0]?.entry).toBeInstanceOf(Anime);
    expect(newer?.tags.find(t => t.id === "t3")?.entry).toBeInstanceOf(YouTube);
  });

  it("keeps tags whose entry is missing, with a null entry", () => {
    const [newer] = hydratePosts(posts, entries);
    const orphan = newer?.tags.find(t => t.id === "t4");

    expect(orphan?.entry).toBeNull();
    expect(orphan?.getTitle()).toBe("3");
    expect(orphan?.getShortTitle()).toBe("3");
  });

  it("sorts posts newest first and tags by start time", () => {
    const hydrated = hydratePosts(posts, entries);

    expect(hydrated.map(p => p.id)).toEqual(["p2", "p1"]);
    expect(hydrated[1]?.tags.map(t => t.id)).toEqual(["t1", "t2"]);
  });

  it("builds short titles per entry type", () => {
    const [newer, older] = hydratePosts(posts, entries);

    expect(older?.tags[0]?.getShortTitle()).toBe("Clev - 3");
    expect(newer?.tags.find(t => t.id === "t3")?.getShortTitle()).toBe("Short");
  });

  it("does not reorder the entry's alternative titles", () => {
    const anime = createEntry(entries[0] as TEntry);

    expect(anime.altTitles).toEqual(["Clevatess: Majuu no Ou", "Clev"]);
  });
});

describe("findReactions", () => {
  it("lists every reaction to an entry with its post", () => {
    const reactions = findReactions(hydratePosts(posts, entries), "e1");

    expect(reactions.map(r => [r.postId, r.tag.id])).toEqual([["p1", "t1"], ["p1", "t2"]]);
  });
});

describe("entry links", () => {
  it("hides links for ids that are unknown", () => {
    const anime = createEntry({ id: "e9", title: "Unknown", type: EEntryType.ANIME, altTitles: [] });

    expect(anime.getOptions().filter(option => option.canShow())).toEqual([]);
  });

  it("offers the video link only when the reaction names a video", () => {
    const channel = createEntry(entries[1] as TEntry);
    const labels = (context: Record<string, unknown>) => channel.getOptions(context).filter(o => o.canShow()).map(o => o.label);

    expect(labels({})).toEqual(["View Some Channel Channel"]);
    expect(labels({ videoId: "abc" })).toEqual(["Watch on YouTube", "View Some Channel Channel"]);
  });
});
