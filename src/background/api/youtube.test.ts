import { fakeBrowser } from "wxt/testing/fake-browser";
import { channelInfoCacheItem } from "../../core/storage/items";
import { getChannelInfo, getChannelInfos } from "./youtube";



const HOUR_MS = 60 * 60 * 1000;

/**
 * @description
 * A channel as the YouTube Data API returns it.
 *
 * @param id - The channel's ID
 * @param overrides - Fields to replace
 * @returns The channel
 */
function channel(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    snippet: { description: `  About ${id}  `, thumbnails: { medium: { url: `https://yt3.ggpht.com/${id}` } } },
    statistics: { subscriberCount: "1200" },
    ...overrides,
  };
}

/**
 * @description
 * Answers YouTube requests with the channels asked for that are known.
 *
 * @param known - The channels YouTube knows
 * @returns The fetch stub
 */
function stubFetch(known: Array<ReturnType<typeof channel>>) {
  const fetch = vi.fn(async (url: URL) => {
    const ids = url.searchParams.get("id")?.split(",") ?? [];

    return new Response(JSON.stringify({ items: known.filter(item => ids.includes(item.id)) }));
  });

  vi.stubGlobal("fetch", fetch);

  return fetch;
}

beforeEach(() => {
  fakeBrowser.reset();
  vi.stubEnv("WXT_YOUTUBE_DATA_API_KEY", "api-key");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("getChannelInfos", () => {
  it("asks YouTube for the channels' snippet and statistics, and maps them", async () => {
    const fetch = stubFetch([channel("a"), channel("b")]);

    const infos = await getChannelInfos(["a", "b"]);

    expect(infos.get("a")).toEqual({ description: "About a", thumbnail: "https://yt3.ggpht.com/a", subscribers: 1200 });
    expect(infos.size).toBe(2);

    const url = fetch.mock.calls[0]?.[0] as URL;

    expect(url.origin + url.pathname).toBe("https://www.googleapis.com/youtube/v3/channels");
    expect(Object.fromEntries(url.searchParams)).toEqual({ part: "snippet,statistics", id: "a,b", key: "api-key" });
  });

  it("asks for at most fifty channels at a time", async () => {
    const ids = Array.from({ length: 51 }, (_, i) => `c${i}`);
    const fetch = stubFetch(ids.map(id => channel(id)));

    const infos = await getChannelInfos(ids);

    expect(infos.size).toBe(51);
    expect(fetch.mock.calls.map(([url]) => (url as URL).searchParams.get("id")?.split(",").length).sort()).toEqual([1, 50]);
  });

  it("counts no subscribers when the number is unreadable", async () => {
    stubFetch([channel("a", { statistics: { subscriberCount: "n/a" } })]);

    const infos = await getChannelInfos(["a"]);

    expect(infos.get("a")?.subscribers).toBe(0);
  });

  it("ignores malformed channels and unexpected answers", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ items: [{ id: "b" }, null, channel("a")] }))));

    const infos = await getChannelInfos(["a", "b"]);

    expect([...infos.keys()]).toEqual(["a"]);

    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ items: "nope" }))));
    expect((await getChannelInfos(["c"])).size).toBe(0);

    vi.stubGlobal("fetch", vi.fn(async () => new Response("null")));
    expect((await getChannelInfos(["d"])).size).toBe(0);
  });

  it("keeps the pages that loaded when another fails", async () => {
    const ids = Array.from({ length: 51 }, (_, i) => `c${i}`);

    vi.stubGlobal("fetch", vi.fn(async (url: URL) => {
      const requested = url.searchParams.get("id")?.split(",") ?? [];

      if (requested.length === 1) {
        throw new TypeError("Network error");
      }

      return new Response(JSON.stringify({ items: requested.map(id => channel(id)) }));
    }));

    const infos = await getChannelInfos(ids);

    expect(infos.size).toBe(50);
    expect(infos.has("c50")).toBe(false);
  });

  it("asks for nothing without an API key", async () => {
    vi.stubEnv("WXT_YOUTUBE_DATA_API_KEY", "");

    const fetch = stubFetch([channel("a")]);

    expect((await getChannelInfos(["a"])).size).toBe(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("keeps details for a day, and asks again for channels it did not find", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });

    const fetch = stubFetch([channel("a")]);

    await getChannelInfos(["a", "missing"]);
    await getChannelInfos(["a", "missing"]);

    expect(fetch.mock.calls.map(([url]) => (url as URL).searchParams.get("id"))).toEqual(["a,missing", "missing"]);
    expect(Object.keys(await channelInfoCacheItem.getValue())).toEqual(["a"]);

    vi.setSystemTime(Date.now() + 23 * HOUR_MS);
    await getChannelInfos(["a"]);
    expect(fetch).toHaveBeenCalledTimes(2);

    vi.setSystemTime(Date.now() + 2 * HOUR_MS);
    await getChannelInfos(["a"]);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});

describe("getChannelInfo", () => {
  it("gives one channel's details", async () => {
    stubFetch([channel("a")]);

    await expect(getChannelInfo("a")).resolves.toEqual({ description: "About a", thumbnail: "https://yt3.ggpht.com/a", subscribers: 1200 });
  });

  it("gives a placeholder when the channel cannot be found", async () => {
    stubFetch([]);

    const info = await getChannelInfo("a");

    expect(info).toMatchObject({ subscribers: 0, totalViews: 0, description: "" });
    expect(info.thumbnail).toContain("placeholder");
  });
});
