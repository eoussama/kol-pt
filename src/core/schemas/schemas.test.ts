import { EEntryType } from "../enums/entry-type.enum";
import { EntryListSchema } from "./entry/entry.schema";
import { PostListSchema, PostSchema } from "./post.schema";
import { normalizeList } from "./primitives.schema";



const tag = { id: "t1", entryId: "e1", label: "3", startTime: 120, endTime: 600 };

describe("normalizeList", () => {
  it.each([
    [["a", null, "b"], ["a", "b"]],
    [{ 0: "a", 2: "b" }, ["a", "b"]],
    [null, []],
    [undefined, []],
    ["text", []],
  ])("reads %j as %j", (value, expected) => {
    expect(normalizeList(value)).toEqual(expected);
  });
});

describe("postSchema", () => {
  it("reads ids, labels and dates stored in other shapes", () => {
    const post = PostSchema.parse({
      id: 171089353,
      title: "Stream",
      creationDate: "2026-10-01T08:50:33.000Z",
      tags: { 0: { ...tag, id: 7, label: 3, startTime: "120" } },
    });

    expect(post.id).toBe("171089353");
    expect(post.creationDate).toBe(Date.parse("2026-10-01T08:50:33.000Z"));
    expect(post.tags).toEqual([expect.objectContaining({ id: "7", label: "3", startTime: 120, description: "", context: {} })]);
  });

  it("defaults the fields the database may drop", () => {
    const post = PostSchema.parse({ id: "1", title: "Stream", creationDate: 0 });

    expect(post).toMatchObject({ description: "", thumbnail: "", tags: [] });
  });

  it("drops a malformed tag without losing the post", () => {
    const post = PostSchema.parse({ id: "1", title: "Stream", creationDate: 0, tags: [tag, { id: "broken" }] });

    expect(post.tags.map(t => t.id)).toEqual(["t1"]);
  });

  it("drops a malformed post without losing the list", () => {
    const posts = PostListSchema.parse([{ id: "1", title: "Stream", creationDate: 0 }, { title: "no id" }, null]);

    expect(posts.map(p => p.id)).toEqual(["1"]);
  });
});

describe("entryListSchema", () => {
  it("reads each entry type with its own fields", () => {
    const entries = EntryListSchema.parse([
      { id: "e1", title: "Clevatess", type: EEntryType.ANIME, malId: "57891" },
      { id: "e2", title: "Some Channel", type: EEntryType.YOUTUBE, handle: "somechannel" },
      { id: "e3", title: "Some Movie", type: EEntryType.MOVIE },
    ]);

    expect(entries).toEqual([
      expect.objectContaining({ id: "e1", malId: 57891 }),
      expect.objectContaining({ id: "e2", handle: "somechannel" }),
      expect.objectContaining({ id: "e3" }),
    ]);
  });

  it("reads alternative titles stored as an object and numeric titles", () => {
    const [entry] = EntryListSchema.parse([{ id: "e4", title: 1984, type: EEntryType.MOVIE, altTitles: { 0: "Nineteen Eighty-Four" } }]);

    expect(entry).toMatchObject({ title: "1984", altTitles: ["Nineteen Eighty-Four"] });
  });

  it("drops entries of unknown type", () => {
    expect(EntryListSchema.parse([{ id: "x", title: "?", type: 42 }])).toEqual([]);
  });
});

describe("entries with covers and TV shows", () => {
  it("reads TV show entries and any entry's own cover", () => {
    const [show, movie] = EntryListSchema.parse([
      { id: "e1", type: EEntryType.TV_SHOW, title: "Severance", cover: "https://image.tmdb.org/t/p/w500/a.jpg" },
      { id: "e2", type: EEntryType.MOVIE, title: "Heat" },
    ]);

    expect(show).toMatchObject({ type: EEntryType.TV_SHOW, cover: "https://image.tmdb.org/t/p/w500/a.jpg" });
    expect(movie).not.toHaveProperty("cover");
  });
});
