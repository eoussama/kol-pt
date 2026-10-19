import type { TPost } from "../schemas/post.schema";

import { EEntryType } from "../enums/entry-type.enum";
import { Entry } from "./entry";
import { Post } from "./post";
import { Tag } from "./tag";



const model: TPost = {
  id: "p1",
  title: "Stream day",
  description: "Reacting to a lot",
  thumbnail: "https://example.test/t.jpg",
  creationDate: Date.UTC(2026, 9, 1, 8, 50, 33),
  tags: [],
};

/**
 * @description
 * Builds a reaction.
 *
 * @param id - The reaction's ID
 * @param startTime - When it starts
 * @param details - Other fields
 * @param details.description - The reaction's description
 * @param details.label - The reaction's label
 * @param entry - What it is about
 * @returns The reaction
 */
function tagOf(id: string, startTime: number, details: { label?: string; description?: string } = {}, entry: Entry | null = null) {
  return new Tag({ id, entryId: "e1", label: "1", description: "", startTime, endTime: startTime + 60, context: {}, ...details }, entry);
}

describe("post data", () => {
  it("exposes the model's fields", () => {
    const post = new Post(model, []);

    expect([post.id, post.title, post.description, post.thumbnail]).toEqual(["p1", "Stream day", "Reacting to a lot", "https://example.test/t.jpg"]);
    expect(post.creationDate).toEqual(new Date(model.creationDate));
  });

  it("sorts the reactions by start time, without touching the given list", () => {
    const tags = [tagOf("late", 900), tagOf("early", 10), tagOf("middle", 300)];
    const post = new Post(model, tags);

    expect(post.tags.map(t => t.id)).toEqual(["early", "middle", "late"]);
    expect(tags.map(t => t.id)).toEqual(["late", "early", "middle"]);
  });
});

describe("post search", () => {
  const entry = new Entry({ id: "e1", title: "Severance", type: EEntryType.TV_SHOW, altTitles: [] });
  const post = new Post(model, [
    tagOf("t1", 0, { label: "Pilot", description: "A great opening" }),
    tagOf("t2", 100, { label: "7", description: "" }, entry),
  ]);

  it.each(["stream", "REACTING", "pilot", "great opening"])("matches \"%s\" in the post or its reactions", (query) => {
    expect(post.match(query)).toBe(true);
  });

  it("keeps the post's and reactions' texts apart by spaces", () => {
    expect(post.match("stream day reacting to a lot")).toBe(true);
    expect(post.match("pilot a great opening")).toBe(true);
    expect(post.match("dayreacting")).toBe(false);
    expect(post.match("pilota great")).toBe(false);
  });

  it("matches the creation date as displayed", () => {
    expect(post.match(post.creationDate.toLocaleString())).toBe(true);
  });

  it("matches the entry a reaction is about", () => {
    expect(post.match("severance")).toBe(true);
    expect(post.match("tv show")).toBe(true);
  });

  it("does not match something unrelated", () => {
    expect(post.match("nothing like this")).toBe(false);
  });

  it("does not match an entry for a post without reactions", () => {
    expect(new Post(model, []).match("severance")).toBe(false);
  });

  it("ignores reactions whose entry is unknown", () => {
    expect(new Post(model, [tagOf("t1", 0)]).match("severance")).toBe(false);
  });
});
