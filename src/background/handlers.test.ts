import { browser } from "wxt/browser";
import { getAnimeInfo } from "./api/anime";
import { getEntryCovers } from "./api/covers";
import { getPatreonPostDetails } from "./api/patreon";
import { getChannelInfo } from "./api/youtube";
import { requireUser, signInWithGoogleToken, signOutUser } from "./auth";
import { handlers } from "./handlers";
import { fetchImageAsDataUrl } from "./images";
import { getEntries, getPostsWithEntries } from "./repositories/content";
import { deletePost, deleteTag, isModerator, refreshModerator, saveEntry, savePost, saveTag } from "./repositories/moderation";
import { setProgress } from "./repositories/progress";
import { clearReports, createReport, loadReports, resolveReport } from "./repositories/reports";
import { getSettings, updateSettings } from "./repositories/settings";
import { favorites, setWatched } from "./repositories/watchlist";



vi.mock("./auth", async importOriginal => ({
  ...await importOriginal<typeof import("./auth")>(),
  requireUser: vi.fn(),
  signOutUser: vi.fn(),
  signInWithGoogleToken: vi.fn(),
}));
vi.mock("./api/anime", () => ({ getAnimeInfo: vi.fn() }));
vi.mock("./api/covers", () => ({ getEntryCovers: vi.fn() }));
vi.mock("./api/patreon", () => ({ getPatreonPostDetails: vi.fn() }));
vi.mock("./api/youtube", () => ({ getChannelInfo: vi.fn() }));
vi.mock("./images", () => ({ fetchImageAsDataUrl: vi.fn() }));
vi.mock("./repositories/content", () => ({ getEntries: vi.fn(), getPostsWithEntries: vi.fn() }));
vi.mock("./repositories/moderation", () => ({
  deletePost: vi.fn(),
  deleteTag: vi.fn(),
  isModerator: vi.fn(),
  refreshModerator: vi.fn(),
  saveEntry: vi.fn(),
  savePost: vi.fn(),
  saveTag: vi.fn(),
}));
vi.mock("./repositories/progress", () => ({ setProgress: vi.fn() }));
vi.mock("./repositories/reports", () => ({
  clearReports: vi.fn(),
  createReport: vi.fn(),
  loadReports: vi.fn(),
  resolveReport: vi.fn(),
}));
vi.mock("./repositories/settings", () => ({ getSettings: vi.fn(), updateSettings: vi.fn() }));
vi.mock("./repositories/watchlist", () => ({ favorites: { path: "favorites" }, setWatched: vi.fn() }));

const channel = "kol-pt";
const sender = {};
const firebaseUser = { uid: "u1", email: "u1@example.com", displayName: "Viewer", photoURL: null, refreshToken: "secret" };
const authUser = { uid: "u1", email: "u1@example.com", displayName: "Viewer", photoURL: null };
const content = { posts: [], entries: [] };

const post = { id: "p1", title: "One", description: "", creationDate: 5, thumbnail: "" };
const tag = { id: "t1", entryId: "e1", label: "Ep 1", description: "", startTime: 0, endTime: 10, context: {} };
const entry = { id: "e1", type: 0 as const, title: "Show", altTitles: [] };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(requireUser).mockResolvedValue(firebaseUser as never);
  vi.mocked(isModerator).mockResolvedValue(false);
});

describe("public data handlers", () => {
  it("lists the posts with their entries, forced or not", async () => {
    vi.mocked(getPostsWithEntries).mockResolvedValue(content);

    await expect(handlers["posts.list"]({ channel, type: "posts.list" }, sender)).resolves.toBe(content);
    expect(getPostsWithEntries).toHaveBeenLastCalledWith(undefined);

    await handlers["posts.list"]({ channel, type: "posts.list", force: true }, sender);

    expect(getPostsWithEntries).toHaveBeenLastCalledWith(true);
  });

  it("reads a post's details", async () => {
    const details = { publishedAt: 5, thumbnail: null };

    vi.mocked(getPatreonPostDetails).mockResolvedValue(details);

    await expect(handlers["posts.details"]({ channel, type: "posts.details", postId: "172" }, sender)).resolves.toBe(details);
    expect(getPatreonPostDetails).toHaveBeenCalledExactlyOnceWith("172");
  });

  it("lists the entries, forced or not", async () => {
    vi.mocked(getEntries).mockResolvedValue([entry]);

    await expect(handlers["entries.list"]({ channel, type: "entries.list" }, sender)).resolves.toEqual([entry]);
    expect(getEntries).toHaveBeenLastCalledWith(undefined);

    await handlers["entries.list"]({ channel, type: "entries.list", force: true }, sender);

    expect(getEntries).toHaveBeenLastCalledWith(true);
  });

  it("finds covers for the cached entries", async () => {
    vi.mocked(getEntries).mockResolvedValue([entry]);
    vi.mocked(getEntryCovers).mockResolvedValue({ e1: "https://s4.anilist.co/a.jpg" });

    await expect(handlers["entries.covers"]({ channel, type: "entries.covers" }, sender)).resolves.toEqual({ e1: "https://s4.anilist.co/a.jpg" });
    expect(getEntries).toHaveBeenCalledExactlyOnceWith();
    expect(getEntryCovers).toHaveBeenCalledExactlyOnceWith([entry]);
  });

  it("looks up an anime by either ID", async () => {
    const info = { description: "", genres: [], altTitles: [], photo: "" };

    vi.mocked(getAnimeInfo).mockResolvedValue(info);

    await expect(handlers["anime.info"]({ channel, type: "anime.info", malId: 1, anilistId: 2 }, sender)).resolves.toBe(info);
    expect(getAnimeInfo).toHaveBeenCalledExactlyOnceWith({ malId: 1, anilistId: 2 });
  });

  it("looks up a YouTube channel", async () => {
    const info = { description: "", thumbnail: "", subscribers: 3 };

    vi.mocked(getChannelInfo).mockResolvedValue(info);

    await expect(handlers["youtube.channel"]({ channel, type: "youtube.channel", channelId: "UC1" }, sender)).resolves.toBe(info);
    expect(getChannelInfo).toHaveBeenCalledExactlyOnceWith("UC1");
  });

  it("fetches an image as a data URL", async () => {
    vi.mocked(fetchImageAsDataUrl).mockResolvedValue("data:image/png;base64,AQID");

    await expect(handlers["images.fetch"]({ channel, type: "images.fetch", url: "https://cdn.myanimelist.net/a.png" }, sender)).resolves.toBe("data:image/png;base64,AQID");
    expect(fetchImageAsDataUrl).toHaveBeenCalledExactlyOnceWith("https://cdn.myanimelist.net/a.png");
  });
});

describe("auth handlers", () => {
  const extensionPage = { id: browser.runtime.id, url: browser.runtime.getURL("/popup.html") };
  const website = { id: browser.runtime.id, url: "https://www.patreon.com/posts/1", tab: { id: 1 } as never };

  it("signs in from an extension page", async () => {
    vi.mocked(signInWithGoogleToken).mockResolvedValue(authUser);

    await expect(handlers["auth.signIn"]({ channel, type: "auth.signIn", idToken: "token" }, extensionPage)).resolves.toBe(authUser);
    expect(signInWithGoogleToken).toHaveBeenCalledExactlyOnceWith("token");
  });

  it("signs out from an extension page", async () => {
    await expect(handlers["auth.signOut"]({ channel, type: "auth.signOut" }, extensionPage)).resolves.toBeNull();
    expect(signOutUser).toHaveBeenCalledOnce();
  });

  it("refuses to sign in from a website", async () => {
    await expect(handlers["auth.signIn"]({ channel, type: "auth.signIn", idToken: "token" }, website)).rejects.toThrow("Signing in is only allowed from the extension");
    expect(signInWithGoogleToken).not.toHaveBeenCalled();
  });

  it("refuses to sign out from a website", async () => {
    await expect(handlers["auth.signOut"]({ channel, type: "auth.signOut" }, website)).rejects.toThrow("Signing out is only allowed from the extension");
    expect(signOutUser).not.toHaveBeenCalled();
  });
});

describe("signed-in user handlers", () => {
  it("reads the user's settings", async () => {
    const settings = { viewMode: 0 as const };

    vi.mocked(getSettings).mockResolvedValue(settings);

    await expect(handlers["settings.get"]({ channel, type: "settings.get" }, sender)).resolves.toBe(settings);
    expect(getSettings).toHaveBeenCalledExactlyOnceWith("u1");
  });

  it("changes the user's settings", async () => {
    vi.mocked(updateSettings).mockResolvedValue({ viewMode: 0 });

    await expect(handlers["settings.set"]({ channel, type: "settings.set", settings: { viewMode: 0 } }, sender)).resolves.toEqual({ viewMode: 0 });
    expect(updateSettings).toHaveBeenCalledExactlyOnceWith("u1", { viewMode: 0 });
  });

  it("marks a reaction as watched, in the watchlist", async () => {
    vi.mocked(setWatched).mockResolvedValue(["p1/t1"]);

    await expect(handlers["watchlist.set"]({ channel, type: "watchlist.set", postId: "p1", tagId: "t1", watched: true }, sender)).resolves.toEqual(["p1/t1"]);
    expect(setWatched).toHaveBeenCalledExactlyOnceWith("u1", "p1", "t1", true);
  });

  it("marks a reaction as a favorite, in the favorites", async () => {
    vi.mocked(setWatched).mockResolvedValue(["p1/t1"]);

    await expect(handlers["favorites.set"]({ channel, type: "favorites.set", postId: "p1", tagId: "t1", favorite: false }, sender)).resolves.toEqual(["p1/t1"]);
    expect(setWatched).toHaveBeenCalledExactlyOnceWith("u1", "p1", "t1", false, Date.now, favorites);
  });

  it("saves where the user stopped watching a post", async () => {
    await expect(handlers["progress.set"]({ channel, type: "progress.set", postId: "p1", time: 90 }, sender)).resolves.toBeNull();
    expect(setProgress).toHaveBeenCalledExactlyOnceWith("u1", "p1", 90);
  });

  it("files a report with the reporter's shared details only", async () => {
    const report = { kind: "missing" as const, postId: "p1", postTitle: "", note: "" };

    await expect(handlers["reports.create"]({ channel, type: "reports.create", report }, sender)).resolves.toBeNull();
    expect(createReport).toHaveBeenCalledExactlyOnceWith(authUser, report);
  });

  it.each([
    ["settings.get", { channel, type: "settings.get" }],
    ["settings.set", { channel, type: "settings.set", settings: {} }],
    ["watchlist.set", { channel, type: "watchlist.set", postId: "p1", tagId: "t1", watched: true }],
    ["favorites.set", { channel, type: "favorites.set", postId: "p1", tagId: "t1", favorite: true }],
    ["progress.set", { channel, type: "progress.set", postId: "p1", time: 1 }],
    ["moderation.refresh", { channel, type: "moderation.refresh" }],
    ["reports.create", { channel, type: "reports.create", report: { kind: "missing", postId: "p1", postTitle: "", note: "" } }],
  ] as const)("refuses %s when nobody is signed in", async (type, request) => {
    vi.mocked(requireUser).mockRejectedValue(new Error("Not signed in"));

    await expect((handlers[type] as (request: unknown, sender: unknown) => Promise<unknown>)(request, sender)).rejects.toThrow("Not signed in");
    expect(getSettings).not.toHaveBeenCalled();
    expect(updateSettings).not.toHaveBeenCalled();
    expect(setWatched).not.toHaveBeenCalled();
    expect(setProgress).not.toHaveBeenCalled();
    expect(createReport).not.toHaveBeenCalled();
    expect(refreshModerator).not.toHaveBeenCalled();
  });
});

describe("moderation.refresh", () => {
  it("loads the reports of a moderator", async () => {
    vi.mocked(refreshModerator).mockResolvedValue(true);

    await expect(handlers["moderation.refresh"]({ channel, type: "moderation.refresh" }, sender)).resolves.toEqual({ moderator: true });
    expect(refreshModerator).toHaveBeenCalledExactlyOnceWith("u1");
    expect(loadReports).toHaveBeenCalledExactlyOnceWith("u1");
    expect(clearReports).not.toHaveBeenCalled();
  });

  it("forgets the reports of anyone else", async () => {
    vi.mocked(refreshModerator).mockResolvedValue(false);

    await expect(handlers["moderation.refresh"]({ channel, type: "moderation.refresh" }, sender)).resolves.toEqual({ moderator: false });
    expect(clearReports).toHaveBeenCalledOnce();
    expect(loadReports).not.toHaveBeenCalled();
  });
});

describe("moderator handlers", () => {
  const actions = [
    ["posts.save", { channel, type: "posts.save", post }, savePost, [post]],
    ["posts.delete", { channel, type: "posts.delete", postId: "p1" }, deletePost, ["p1"]],
    ["tags.save", { channel, type: "tags.save", postId: "p1", tag }, saveTag, ["p1", tag]],
    ["tags.delete", { channel, type: "tags.delete", postId: "p1", tagId: "t1" }, deleteTag, ["p1", "t1"]],
    ["entries.save", { channel, type: "entries.save", entry }, saveEntry, [entry]],
  ] as const;

  it.each(actions)("%s lets a moderator change the content", async (type, request, change, args) => {
    vi.mocked(isModerator).mockResolvedValue(true);
    vi.mocked(change as (...args: Array<unknown>) => Promise<unknown>).mockResolvedValue(content);

    await expect((handlers[type] as (request: unknown, sender: unknown) => Promise<unknown>)(request, sender)).resolves.toBe(content);
    expect(isModerator).toHaveBeenCalledExactlyOnceWith("u1");
    expect(change).toHaveBeenCalledExactlyOnceWith(...args);
  });

  it.each(actions)("%s refuses anyone else", async (type, request, change) => {
    await expect((handlers[type] as (request: unknown, sender: unknown) => Promise<unknown>)(request, sender)).rejects.toThrow("Only moderators can do this");
    expect(change).not.toHaveBeenCalled();
  });

  it.each(actions)("%s refuses when nobody is signed in", async (type, request, change) => {
    vi.mocked(requireUser).mockRejectedValue(new Error("Not signed in"));

    await expect((handlers[type] as (request: unknown, sender: unknown) => Promise<unknown>)(request, sender)).rejects.toThrow("Not signed in");
    expect(isModerator).not.toHaveBeenCalled();
    expect(change).not.toHaveBeenCalled();
  });

  it("lets a moderator close a report", async () => {
    vi.mocked(isModerator).mockResolvedValue(true);

    await expect(handlers["reports.resolve"]({ channel, type: "reports.resolve", reportId: "r1" }, sender)).resolves.toBeNull();
    expect(resolveReport).toHaveBeenCalledExactlyOnceWith("u1", "r1");
  });

  it("refuses to let anyone else close a report", async () => {
    await expect(handlers["reports.resolve"]({ channel, type: "reports.resolve", reportId: "r1" }, sender)).rejects.toThrow("Only moderators can do this");
    expect(resolveReport).not.toHaveBeenCalled();
  });
});
