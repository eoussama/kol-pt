import { EEntryType } from "../enums/entry-type.enum";
import { EntryInputSchema, PostInputSchema, ReportInputSchema, ReportKindSchema, ReportSchema, TagInputSchema } from "./moderation.schema";



const post = { id: "171089353", title: "Stream", creationDate: 1700000000000 };
const tag = { id: "t1", entryId: "e1", label: "3", startTime: 10, endTime: 70 };
const report = { kind: "missing", postId: "171089353" };

/**
 * @description
 * The messages of the issues a parse found.
 *
 * @param result - The parse result
 * @param result.success - Whether the parse succeeded
 * @param result.error - Why it failed
 * @param result.error.issues - The issues found
 * @returns The messages
 */
function issuesOf(result: { success: boolean; error?: { issues: Array<{ message: string }> } }): Array<string> {
  return result.error?.issues.map(issue => issue.message) ?? [];
}

describe("postInputSchema", () => {
  it("defaults the description and thumbnail", () => {
    expect(PostInputSchema.parse(post)).toEqual({ ...post, description: "", thumbnail: "" });
  });

  it("trims the title", () => {
    expect(PostInputSchema.parse({ ...post, title: "  Stream  " }).title).toBe("Stream");
  });

  it("accepts an https thumbnail", () => {
    expect(PostInputSchema.parse({ ...post, thumbnail: "https://cdn.test/a.jpg" }).thumbnail).toBe("https://cdn.test/a.jpg");
  });

  it.each(["http://cdn.test/a.jpg", "httpsx://cdn.test/a.jpg", "xhttps://cdn.test/a.jpg", "javascript:alert(1)", "not a url"])("rejects the thumbnail %s", (thumbnail) => {
    expect(PostInputSchema.safeParse({ ...post, thumbnail }).success).toBe(false);
  });

  it.each([
    ["an empty ID", { id: "  " }],
    ["a long ID", { id: "x".repeat(301) }],
    ["an empty title", { title: "" }],
    ["a long title", { title: "x".repeat(301) }],
    ["a long description", { description: "x".repeat(5001) }],
    ["a fractional date", { creationDate: 1.5 }],
    ["a zero date", { creationDate: 0 }],
    ["a negative date", { creationDate: -1 }],
  ])("rejects %s", (_name, override) => {
    expect(PostInputSchema.safeParse({ ...post, ...override }).success).toBe(false);
  });

  it("accepts the longest values", () => {
    expect(PostInputSchema.safeParse({ ...post, id: "x".repeat(300), title: "x".repeat(300), description: "x".repeat(5000) }).success).toBe(true);
  });
});

describe("tagInputSchema", () => {
  it("defaults the description and context", () => {
    expect(TagInputSchema.parse(tag)).toEqual({ ...tag, description: "", context: {} });
  });

  it("reads the YouTube context", () => {
    const context = { title: " A video ", videoId: " abc ", altTitles: ["Short"] };

    expect(TagInputSchema.parse({ ...tag, context }).context).toEqual({ title: "A video", videoId: "abc", altTitles: ["Short"] });
  });

  it("rejects a reaction that ends when it starts or before", () => {
    const equal = TagInputSchema.safeParse({ ...tag, startTime: 10, endTime: 10 });
    const before = TagInputSchema.safeParse({ ...tag, startTime: 10, endTime: 5 });

    expect(issuesOf(equal)).toEqual(["A reaction must end after it starts"]);
    expect(equal.error?.issues[0]?.path).toEqual(["endTime"]);
    expect(before.success).toBe(false);
  });

  it("accepts a reaction that starts at zero and ends at the limit", () => {
    expect(TagInputSchema.safeParse({ ...tag, startTime: 0, endTime: 86400 }).success).toBe(true);
  });

  it.each([
    ["a negative start", { startTime: -1 }],
    ["an end past a day", { endTime: 86401 }],
    ["an infinite end", { endTime: Infinity }],
    ["an empty label", { label: "" }],
    ["a long label", { label: "x".repeat(201) }],
    ["an empty entry", { entryId: "" }],
    ["a long ID", { id: "x".repeat(101) }],
    ["a long description", { description: "x".repeat(1001) }],
    ["a long video ID", { context: { videoId: "x".repeat(51) } }],
    ["a long context title", { context: { title: "x".repeat(301) } }],
    ["an empty alternative title", { context: { altTitles: [""] } }],
    ["too many alternative titles", { context: { altTitles: Array.from({ length: 21 }, (_, i) => `t${i}`) } }],
  ])("rejects %s", (_name, override) => {
    expect(TagInputSchema.safeParse({ ...tag, ...override }).success).toBe(false);
  });
});

describe("entryInputSchema", () => {
  const base = { id: "e1", title: "Clevatess" };

  it.each([
    [EEntryType.ANIME],
    [EEntryType.MOVIE],
    [EEntryType.TV_SHOW],
    [EEntryType.CARTOON],
    [EEntryType.YOUTUBE],
  ])("accepts type %s with defaults", (type) => {
    expect(EntryInputSchema.parse({ ...base, type })).toEqual({ ...base, type, altTitles: [] });
  });

  it("rejects an unknown type", () => {
    expect(EntryInputSchema.safeParse({ ...base, type: 42 }).success).toBe(false);
  });

  it("reads an anime's identifiers", () => {
    expect(EntryInputSchema.parse({ ...base, type: EEntryType.ANIME, malId: 57891, anilistId: 170000, kitsuId: " clevatess " })).toMatchObject({
      malId: 57891,
      anilistId: 170000,
      kitsuId: "clevatess",
    });
  });

  it.each([0, -1, 1.5])("rejects the anime ID %s", (malId) => {
    expect(EntryInputSchema.safeParse({ ...base, type: EEntryType.ANIME, malId }).success).toBe(false);
    expect(EntryInputSchema.safeParse({ ...base, type: EEntryType.ANIME, anilistId: malId }).success).toBe(false);
  });

  it("reads a movie's Rotten Tomatoes ID", () => {
    expect(EntryInputSchema.parse({ ...base, type: EEntryType.MOVIE, rottentomatoesId: "m/heat" })).toMatchObject({ rottentomatoesId: "m/heat" });
  });

  it("reads a channel's handle and ID", () => {
    expect(EntryInputSchema.parse({ ...base, type: EEntryType.YOUTUBE, handle: "chan", channelId: "UC1" })).toMatchObject({ handle: "chan", channelId: "UC1" });
  });

  it("drops empty identifiers", () => {
    const entry = EntryInputSchema.parse({ ...base, type: EEntryType.YOUTUBE, imdbId: "  ", handle: "", channelId: "   " });

    expect(entry.imdbId).toBeUndefined();
    expect(entry).toMatchObject({ handle: undefined, channelId: undefined });
  });

  it("keeps an IMDb ID, trimmed", () => {
    expect(EntryInputSchema.parse({ ...base, type: EEntryType.MOVIE, imdbId: " tt0113277 " }).imdbId).toBe("tt0113277");
  });

  it("rejects a long identifier", () => {
    expect(EntryInputSchema.safeParse({ ...base, type: EEntryType.MOVIE, imdbId: "x".repeat(201) }).success).toBe(false);
  });

  it("accepts a cover from an allowed site", () => {
    expect(EntryInputSchema.parse({ ...base, type: EEntryType.MOVIE, cover: " https://image.tmdb.org/t/p/w500/a.jpg " }).cover).toBe("https://image.tmdb.org/t/p/w500/a.jpg");
  });

  it("drops an empty cover", () => {
    expect(EntryInputSchema.parse({ ...base, type: EEntryType.MOVIE, cover: " " }).cover).toBeUndefined();
  });

  it("rejects a cover from another site, naming the allowed ones", () => {
    const result = EntryInputSchema.safeParse({ ...base, type: EEntryType.MOVIE, cover: "https://evil.test/a.jpg" });

    expect(issuesOf(result)).toEqual([expect.stringMatching(/^The cover must be an https link from MyAnimeList, .*YouTube$/)]);
  });

  it("rejects an insecure cover", () => {
    expect(EntryInputSchema.safeParse({ ...base, type: EEntryType.MOVIE, cover: "http://image.tmdb.org/a.jpg" }).success).toBe(false);
  });

  it("rejects a long cover link", () => {
    expect(EntryInputSchema.safeParse({ ...base, type: EEntryType.MOVIE, cover: `https://image.tmdb.org/${"x".repeat(500)}` }).success).toBe(false);
  });

  it("limits the alternative titles", () => {
    const titles = (count: number) => Array.from({ length: count }, (_, i) => `Title ${i}`);

    expect(EntryInputSchema.safeParse({ ...base, type: EEntryType.MOVIE, altTitles: titles(30) }).success).toBe(true);
    expect(EntryInputSchema.safeParse({ ...base, type: EEntryType.MOVIE, altTitles: titles(31) }).success).toBe(false);
    expect(EntryInputSchema.safeParse({ ...base, type: EEntryType.MOVIE, altTitles: [""] }).success).toBe(false);
  });

  it("requires an ID and a title", () => {
    expect(EntryInputSchema.safeParse({ ...base, id: "", type: EEntryType.MOVIE }).success).toBe(false);
    expect(EntryInputSchema.safeParse({ ...base, title: "", type: EEntryType.MOVIE }).success).toBe(false);
  });
});

describe("reportKindSchema", () => {
  it.each(["timestamp", "entry", "missing", "untracked"])("accepts %s", (kind) => {
    expect(ReportKindSchema.parse(kind)).toBe(kind);
  });

  it("rejects another kind", () => {
    expect(ReportKindSchema.safeParse("spam").success).toBe(false);
  });
});

describe("reportInputSchema", () => {
  it("defaults the post title and note", () => {
    expect(ReportInputSchema.parse(report)).toEqual({ ...report, postTitle: "", note: "" });
  });

  it.each(["timestamp", "entry"])("requires a %s report to name a reaction", (kind) => {
    const result = ReportInputSchema.safeParse({ ...report, kind });

    expect(issuesOf(result)).toEqual(["Only reports about a reaction name one"]);
    expect(result.error?.issues[0]?.path).toEqual(["tagId"]);
    expect(ReportInputSchema.safeParse({ ...report, kind, tagId: "t1" }).success).toBe(true);
  });

  it.each(["missing", "untracked"])("rejects a %s report that names a reaction", (kind) => {
    expect(ReportInputSchema.safeParse({ ...report, kind, tagId: "t1" }).success).toBe(false);
  });

  it("reads the optional details", () => {
    expect(ReportInputSchema.parse({
      kind: "timestamp",
      postId: "1",
      postTitle: " Stream ",
      tagId: "t1",
      tagTitle: " Episode 3 ",
      note: " Starts late ",
      startTime: 10,
      endTime: 70,
    })).toEqual({
      kind: "timestamp",
      postId: "1",
      postTitle: "Stream",
      tagId: "t1",
      tagTitle: "Episode 3",
      note: "Starts late",
      startTime: 10,
      endTime: 70,
    });
  });

  it.each([
    ["a long note", { note: "x".repeat(501) }],
    ["a long post title", { postTitle: "x".repeat(301) }],
    ["a long tag title", { tagTitle: "x".repeat(301) }],
    ["an empty post", { postId: "" }],
    ["a negative start", { startTime: -1 }],
    ["an end past a day", { endTime: 86401 }],
  ])("rejects %s", (_name, override) => {
    expect(ReportInputSchema.safeParse({ ...report, ...override }).success).toBe(false);
  });
});

describe("reportSchema", () => {
  const stored = { id: "r1", kind: "missing", postId: "1", reporterUid: "u1", createdAt: 1700000000000 };

  it("defaults the text fields the database may drop", () => {
    expect(ReportSchema.parse(stored)).toEqual({ ...stored, postTitle: "", note: "", reporterName: "" });
  });

  it("keeps the fields it knows and any other", () => {
    const parsed = ReportSchema.parse({ ...stored, tagId: "t1", tagTitle: "Ep 3", startTime: 1, endTime: 2, reporterName: "Sam", extra: true });

    expect(parsed).toMatchObject({ tagId: "t1", tagTitle: "Ep 3", startTime: 1, endTime: 2, reporterName: "Sam", extra: true });
  });

  it.each(["id", "kind", "postId", "reporterUid", "createdAt"])("requires %s", (field) => {
    expect(ReportSchema.safeParse({ ...stored, [field]: undefined }).success).toBe(false);
  });
});
