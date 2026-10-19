import type { THandlers } from "./server";

import { browser } from "wxt/browser";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { request } from "../../core/messaging/client";
import { handleRequest, isExtensionPage, serve } from "./server";



function stubHandlers(overrides: Partial<THandlers> = {}): THandlers {
  const fail = async () => {
    throw new Error("not stubbed");
  };

  return {
    "posts.list": async () => ({ posts: [], entries: [] }),
    "posts.details": fail,
    "entries.list": fail,
    "entries.covers": fail,
    "anime.info": fail,
    "youtube.channel": fail,
    "images.fetch": fail,
    "auth.signIn": fail,
    "auth.signOut": fail,
    "settings.get": fail,
    "settings.set": fail,
    "watchlist.set": fail,
    "favorites.set": fail,
    "progress.set": fail,
    "moderation.refresh": fail,
    "posts.save": fail,
    "posts.delete": fail,
    "tags.save": fail,
    "tags.delete": fail,
    "entries.save": fail,
    "reports.create": fail,
    "reports.resolve": fail,
    ...overrides,
  };
}

describe("request protocol", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("answers a request with its handler's result", async () => {
    serve(stubHandlers({ "entries.list": async ({ force }) => force ? [] : [{ id: "e1", title: "Clevatess", type: 0, altTitles: [] }] }));

    await expect(request("entries.list", {})).resolves.toEqual([{ id: "e1", title: "Clevatess", type: 0, altTitles: [] }]);
    await expect(request("entries.list", { force: true })).resolves.toEqual([]);
  });

  it("rejects with the handler's error", async () => {
    serve(stubHandlers());

    await expect(request("anime.info", { malId: 1 })).rejects.toThrow("not stubbed");
  });

  it("refuses malformed requests before they reach a handler", async () => {
    const handler = vi.fn();

    serve(stubHandlers({ "anime.info": handler }));

    await expect(request("anime.info", { malId: -1 })).rejects.toThrow("Invalid request");
    await expect(request("images.fetch", { url: "http://insecure.example/a.png" })).rejects.toThrow("Invalid request");
    expect(handler).not.toHaveBeenCalled();
  });

  it("leaves other messages alone", async () => {
    serve(stubHandlers());

    await expect(browser.runtime.sendMessage({ hello: "world" })).resolves.toBeUndefined();
  });
});

describe("isExtensionPage", () => {
  it("accepts the extension's own pages only", () => {
    const id = browser.runtime.id;
    const page = browser.runtime.getURL("/popup.html");

    expect(isExtensionPage({ id, url: page })).toBe(true);
    expect(isExtensionPage({ id, url: "https://www.patreon.com/cw/SomeCreator/posts" })).toBe(false);
    expect(isExtensionPage({ id: "another-extension", url: page })).toBe(false);
    expect(isExtensionPage({})).toBe(false);
    expect(isExtensionPage({ id })).toBe(false);
  });
});

describe("handleRequest", () => {
  it("wraps results and errors in an envelope", async () => {
    const handlers = stubHandlers();

    await expect(handleRequest(handlers, { channel: "kol-pt", type: "posts.list" }, {})).resolves.toEqual({ ok: true, data: { posts: [], entries: [] } });
    await expect(handleRequest(handlers, { channel: "kol-pt", type: "settings.get" }, {})).resolves.toEqual({ ok: false, error: "not stubbed" });
    await expect(handleRequest(handlers, { channel: "kol-pt", type: "unknown" }, {})).resolves.toEqual({ ok: false, error: "Invalid request" });
  });

  it("reports anything a handler throws as text", async () => {
    const handlers = stubHandlers({
      // Handlers can throw anything, not only errors
      // eslint-disable-next-line prefer-promise-reject-errors
      "settings.get": () => Promise.reject("plain failure"),
    });

    await expect(handleRequest(handlers, { channel: "kol-pt", type: "settings.get" }, {})).resolves.toEqual({ ok: false, error: "plain failure" });
  });

  it("gives handlers the request and who sent it", async () => {
    const posts = vi.fn(async () => ({ posts: [], entries: [] }));
    const sender = { id: "someone", url: "https://www.patreon.com/posts/1" };

    await handleRequest(stubHandlers({ "posts.list": posts }), { channel: "kol-pt", type: "posts.list", force: true }, sender);

    expect(posts).toHaveBeenCalledExactlyOnceWith({ channel: "kol-pt", type: "posts.list", force: true }, sender);
  });
});
