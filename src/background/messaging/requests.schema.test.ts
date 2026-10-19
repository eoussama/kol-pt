import { isOwnMessage, RequestSchema } from "./requests.schema";



/**
 * @description
 * Wraps a request's content with the extension's channel marker.
 *
 * @param type - The request's type
 * @param payload - The request's content
 * @returns The raw message
 */
function message(type: string, payload: Record<string, unknown> = {}): Record<string, unknown> {
  return { channel: "kol-pt", type, ...payload };
}

const tag = { id: "t1", entryId: "e1", label: "Ep 1", startTime: 0, endTime: 10 };

describe("requestSchema", () => {
  it.each([
    message("posts.list"),
    message("posts.list", { force: true }),
    message("posts.details", { postId: "172223755" }),
    message("entries.list", { force: false }),
    message("entries.covers"),
    message("anime.info", { malId: 1 }),
    message("anime.info", { anilistId: 2 }),
    message("anime.info", { malId: 1, anilistId: 2 }),
    message("youtube.channel", { channelId: "UC1" }),
    message("images.fetch", { url: "https://cdn.myanimelist.net/a.png" }),
    message("auth.signIn", { idToken: "token" }),
    message("auth.signOut"),
    message("settings.get"),
    message("settings.set", { settings: {} }),
    message("settings.set", { settings: { viewMode: 0 } }),
    message("watchlist.set", { postId: "p1", tagId: "t1", watched: true }),
    message("favorites.set", { postId: "p1", tagId: "t1", favorite: false }),
    message("progress.set", { postId: "p1", time: 90 }),
    message("progress.set", { postId: "p1", time: null }),
    message("progress.set", { postId: "p1", time: 86400 }),
    message("moderation.refresh"),
    message("posts.save", { post: { id: "p1", title: "One", creationDate: 5 } }),
    message("posts.delete", { postId: "p1" }),
    message("tags.save", { postId: "p1", tag }),
    message("tags.delete", { postId: "p1", tagId: "t1" }),
    message("entries.save", { entry: { id: "e1", type: 0, title: "Show" } }),
    message("reports.create", { report: { kind: "missing", postId: "p1" } }),
    message("reports.resolve", { reportId: "r1" }),
  ])("accepts %j", (request) => {
    expect(RequestSchema.safeParse(request).success).toBe(true);
  });

  it.each([
    ["an unknown type", message("posts.explode")],
    ["a foreign channel", { channel: "other", type: "posts.list" }],
    ["no channel", { type: "posts.list" }],
    ["a post ID that is not numeric", message("posts.details", { postId: "12ab" })],
    ["an anime without an ID", message("anime.info")],
    ["an anime with a negative ID", message("anime.info", { malId: -1 })],
    ["an anime with a fractional ID", message("anime.info", { anilistId: 1.5 })],
    ["an empty channel ID", message("youtube.channel", { channelId: "" })],
    ["an insecure image URL", message("images.fetch", { url: "http://cdn.myanimelist.net/a.png" })],
    ["an empty ID token", message("auth.signIn", { idToken: "" })],
    ["invalid settings", message("settings.set", { settings: { viewMode: 9 } })],
    ["a watchlist change without a flag", message("watchlist.set", { postId: "p1", tagId: "t1" })],
    ["a favorite without a reaction", message("favorites.set", { postId: "p1", tagId: "", favorite: true })],
    ["a negative position", message("progress.set", { postId: "p1", time: -1 })],
    ["a position over a day", message("progress.set", { postId: "p1", time: 86401 })],
    ["a post without a title", message("posts.save", { post: { id: "p1", creationDate: 5 } })],
    ["a reaction ending before it starts", message("tags.save", { postId: "p1", tag: { ...tag, startTime: 10, endTime: 5 } })],
    ["an entry of an unknown type", message("entries.save", { entry: { id: "e1", type: 9, title: "Show" } })],
    ["a report about a reaction without one", message("reports.create", { report: { kind: "timestamp", postId: "p1" } })],
    ["an empty report ID", message("reports.resolve", { reportId: "" })],
  ])("refuses %s", (_, request) => {
    expect(RequestSchema.safeParse(request).success).toBe(false);
  });

  it("explains that an anime needs an ID", () => {
    const result = RequestSchema.safeParse(message("anime.info"));

    expect(result.error?.issues.map(issue => issue.message)).toEqual(["An anime ID is required"]);
  });
});

describe("isOwnMessage", () => {
  it("recognizes the extension's channel marker only", () => {
    expect(isOwnMessage({ channel: "kol-pt", type: "anything" })).toBe(true);
    expect(isOwnMessage({ channel: "other" })).toBe(false);
    expect(isOwnMessage({})).toBe(false);
    expect(isOwnMessage(null)).toBe(false);
    expect(isOwnMessage("kol-pt")).toBe(false);
    expect(isOwnMessage(undefined)).toBe(false);
  });
});
