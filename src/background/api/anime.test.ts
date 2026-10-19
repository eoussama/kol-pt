import { fakeBrowser } from "wxt/testing/fake-browser";
import { animeInfoCacheItem, coversCacheItem } from "../../core/storage/items";
import { getAniListCovers, getAniListInfo, toPlainText } from "./anilist";
import { getAnimeInfo } from "./anime";
import { getEntryCovers } from "./covers";
import { getJikanInfo } from "./jikan";



const media = {
  title: { romaji: "Dead Mount Death Play", english: "Dead Mount Death Play", native: "デッドマウント・デスプレイ" },
  description: "A hero&#039;s <i>last</i> fight.<br>\n<br>\n(Source: Crunchyroll)",
  genres: ["Action", "Fantasy"],
  coverImage: { extraLarge: "https://s4.anilist.co/file/a.jpg", large: "https://s4.anilist.co/file/b.jpg" },
};

const jikan = {
  synopsis: "From Jikan.",
  images: { webp: { large_image_url: "https://cdn.myanimelist.net/a.webp" } },
  genres: [{ name: "Action" }],
  title: "Shikabane",
  title_english: null,
  title_japanese: "屍",
};

/**
 * @description
 * Answers AniList and Jikan requests, or fails them.
 *
 * @param answers - What each API answers, a failure when missing
 * @param answers.anilist - AniList's Media, null for none
 * @param answers.jikan - Jikan's data
 * @returns The fetch stub
 */
function stubFetch(answers: { anilist?: unknown; jikan?: unknown }) {
  const fetch = vi.fn(async (url: string, _init?: RequestInit) => {
    const answer = url.includes("anilist") ? answers.anilist : answers.jikan;

    if (answer === undefined) {
      throw new TypeError("Network error");
    }

    return new Response(JSON.stringify({ data: url.includes("anilist") ? { Media: answer } : answer }));
  });

  vi.stubGlobal("fetch", fetch);

  return fetch;
}

beforeEach(() => {
  fakeBrowser.reset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("toPlainText", () => {
  it("drops AniList's HTML and decodes its entities", () => {
    expect(toPlainText(media.description)).toBe("A hero's last fight.\n\n(Source: Crunchyroll)");
  });

  it("turns every kind of line break into a new line", () => {
    expect(toPlainText("a<br>b<br/>c<br />d<BR  />e")).toBe("a\nb\nc\nd\ne");
  });

  it("drops a tag left open, up to the end", () => {
    expect(toPlainText("kept <i>this</i> <unclosed")).toBe("kept this");
  });

  it("decodes each entity once, in the right order", () => {
    expect(toPlainText("&quot;a&quot; &#039;b&#039; &#39;c&#39; &apos;d&apos; &lt;e&gt; &amp;f&amp; &amp;lt;")).toBe("\"a\" 'b' 'c' 'd' <e> &f& &lt;");
  });

  it("trims the text", () => {
    expect(toPlainText("  \n text \n  ")).toBe("text");
  });
});

describe("getAniListInfo", () => {
  it("finds an anime by AniList ID, or else by MyAnimeList ID", async () => {
    const fetch = stubFetch({ anilist: media });

    await getAniListInfo({ anilistId: 157198, malId: 53613 });
    await getAniListInfo({ malId: 53613 });

    const variables = fetch.mock.calls.map(([, init]) => JSON.parse(init?.body as string).variables);

    expect(variables).toEqual([{ id: 157198 }, { idMal: 53613 }]);
  });

  it("maps the details", async () => {
    stubFetch({ anilist: media });

    await expect(getAniListInfo({ anilistId: 1 })).resolves.toEqual({
      description: "A hero's last fight.\n\n(Source: Crunchyroll)",
      genres: ["Action", "Fantasy"],
      photo: "https://s4.anilist.co/file/a.jpg",
      altTitles: [
        { title: "Dead Mount Death Play", official: true },
        { title: "Dead Mount Death Play", official: true },
        { title: "デッドマウント・デスプレイ", official: true },
      ],
    });
  });

  it("falls back to the large cover, and to empty text for what AniList lacks", async () => {
    stubFetch({
      anilist: { ...media, description: null, title: { romaji: null, english: "English", native: null }, coverImage: { extraLarge: null, large: "https://s4.anilist.co/file/b.jpg" } },
    });

    await expect(getAniListInfo({ anilistId: 1 })).resolves.toEqual({
      description: "",
      genres: ["Action", "Fantasy"],
      photo: "https://s4.anilist.co/file/b.jpg",
      altTitles: [{ title: "", official: true }, { title: "English", official: true }, { title: "", official: true }],
    });
  });

  it("has nothing for an anime without a cover", async () => {
    stubFetch({ anilist: { ...media, coverImage: { extraLarge: null, large: null } } });

    await expect(getAniListInfo({ anilistId: 1 })).resolves.toBeNull();
  });

  it("has nothing when AniList reports an error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data: { Media: media } }), { status: 500 })));

    await expect(getAniListInfo({ anilistId: 1 })).resolves.toBeNull();
  });

  it("has nothing without an ID, a match or an answer", async () => {
    const fetch = stubFetch({ anilist: null });

    await expect(getAniListInfo({})).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
    await expect(getAniListInfo({ anilistId: 1 })).resolves.toBeNull();

    stubFetch({});
    await expect(getAniListInfo({ anilistId: 1 })).resolves.toBeNull();
  });
});

describe("aniList requests", () => {
  it("post the query, asking for the details wanted, as JSON", async () => {
    const fetch = stubFetch({ anilist: media });
    const timeout = vi.spyOn(AbortSignal, "timeout");

    await getAniListInfo({ anilistId: 1 });

    const [url, init] = fetch.mock.calls[0] ?? [];

    expect(url).toBe("https://graphql.anilist.co");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({ "Content-Type": "application/json", "Accept": "application/json" });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(timeout).toHaveBeenCalledWith(8000);

    const { query } = JSON.parse(init?.body as string);

    expect(query).toContain("query ($id: Int, $idMal: Int)");
    expect(query).toContain("Media(id: $id, idMal: $idMal, type: ANIME)");
    expect(query).toContain("title { romaji english native }");
    expect(query).toContain("description(asHtml: false)");
    expect(query).toContain("genres");
    expect(query).toContain("coverImage { extraLarge large }");
    timeout.mockRestore();
  });

  it("post the covers query as JSON too", async () => {
    const fetch = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify({ data: { Page: { media: [] } } })));
    const timeout = vi.spyOn(AbortSignal, "timeout");

    vi.stubGlobal("fetch", fetch);
    await getAniListCovers({ anilistIds: [1], malIds: [] });

    const [url, init] = fetch.mock.calls[0] ?? [];

    expect(url).toBe("https://graphql.anilist.co");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({ "Content-Type": "application/json", "Accept": "application/json" });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(timeout).toHaveBeenCalledWith(8000);
    expect(JSON.parse(init?.body as string).query).toContain("Page(perPage: 50) { media(id_in: $ids, type: ANIME) { id idMal coverImage { large } } }");
    timeout.mockRestore();
  });
});

describe("getAnimeInfo", () => {
  it("prefers AniList", async () => {
    const fetch = stubFetch({ anilist: media, jikan });

    await expect(getAnimeInfo({ malId: 1, anilistId: 2 })).resolves.toMatchObject({ photo: "https://s4.anilist.co/file/a.jpg" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("falls back to Jikan when AniList does not answer", async () => {
    stubFetch({ jikan });

    await expect(getAnimeInfo({ malId: 1, anilistId: 2 })).resolves.toMatchObject({ description: "From Jikan.", photo: "https://cdn.myanimelist.net/a.webp" });
  });

  it("keeps what it found for a week, by the ID it asked with", async () => {
    const fetch = stubFetch({ anilist: media });

    await getAnimeInfo({ malId: 1, anilistId: 2 });
    await getAnimeInfo({ anilistId: 2 });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(Object.keys(await animeInfoCacheItem.getValue())).toEqual(["anilist:2"]);
  });

  it("keeps it for exactly seven days", async () => {
    const week = 7 * 24 * 60 * 60 * 1000;
    const fetch = stubFetch({ anilist: media });

    await animeInfoCacheItem.setValue({ "anilist:2": { updatedAt: Date.now() - week + 60_000, data: { description: "cached", genres: [], altTitles: [], photo: "https://s4.anilist.co/x.jpg" } } });
    await expect(getAnimeInfo({ anilistId: 2 })).resolves.toMatchObject({ description: "cached" });
    expect(fetch).not.toHaveBeenCalled();

    await animeInfoCacheItem.setValue({ "anilist:2": { updatedAt: Date.now() - week - 60_000, data: { description: "cached", genres: [], altTitles: [], photo: "https://s4.anilist.co/x.jpg" } } });
    await expect(getAnimeInfo({ anilistId: 2 })).resolves.toMatchObject({ description: "A hero's last fight.\n\n(Source: Crunchyroll)" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not keep the placeholder, so it asks again", async () => {
    const fetch = stubFetch({});

    await getAnimeInfo({ malId: 1 });
    await getAnimeInfo({ malId: 1 });

    expect(fetch.mock.calls.length).toBeGreaterThan(2);
    await expect(animeInfoCacheItem.getValue()).resolves.toEqual({});
  });

  it("does not ask Jikan for an anime without a MyAnimeList ID", async () => {
    const fetch = stubFetch({ jikan });

    const info = await getAnimeInfo({ anilistId: 2 });

    expect(info.photo).toContain("placeholder");
    expect(fetch.mock.calls.map(([url]) => url)).toEqual(["https://graphql.anilist.co"]);
  });

  it("gives a placeholder when neither answers", async () => {
    stubFetch({});

    const info = await getAnimeInfo({ malId: 1 });

    expect(info).toMatchObject({ description: "", genres: [], altTitles: [] });
    expect(info.photo).toContain("placeholder");
  });
});

describe("getJikanInfo", () => {
  it("maps MyAnimeList's details", async () => {
    stubFetch({ jikan });

    await expect(getJikanInfo(1)).resolves.toMatchObject({ genres: ["Action"], altTitles: [{ title: "Shikabane", official: true }, { title: "", official: true }, { title: "屍", official: true }] });
  });

  it("keeps the English and Japanese titles it has", async () => {
    stubFetch({ jikan: { ...jikan, title_english: "Corpse", title_japanese: null } });

    await expect(getJikanInfo(1)).resolves.toMatchObject({ altTitles: [{ title: "Shikabane", official: true }, { title: "Corpse", official: true }, { title: "", official: true }] });
  });

  it("asks for the anime by its MyAnimeList ID", async () => {
    const fetch = stubFetch({ jikan });

    await expect(getJikanInfo(42)).resolves.toMatchObject({ description: "From Jikan.", photo: "https://cdn.myanimelist.net/a.webp" });
    expect(fetch.mock.calls[0]?.[0]).toBe("https://api.jikan.moe/v4/anime/42");
    expect(fetch.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it("gives up after eight seconds", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");

    stubFetch({ jikan });
    await getJikanInfo(1);

    expect(timeout).toHaveBeenCalledWith(8000);
    timeout.mockRestore();
  });

  it("has nothing for an unexpected answer or a failure", async () => {
    stubFetch({ jikan: { synopsis: 5 } });
    await expect(getJikanInfo(1)).resolves.toBeNull();

    stubFetch({});
    await expect(getJikanInfo(1)).resolves.toBeNull();
  });
});

describe("getAniListCovers", () => {
  it("asks for each kind of ID only when there are some, and finds covers by both", async () => {
    const fetch = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify({
      data: { Page: { media: [{ id: 2, idMal: 1, coverImage: { large: "https://s4.anilist.co/c.jpg" } }, { id: 3, idMal: null, coverImage: { large: null } }] } },
    })));

    vi.stubGlobal("fetch", fetch);

    const covers = await getAniListCovers({ anilistIds: [2, 3], malIds: [] });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0]?.[1]?.body).toContain("id_in");
    expect([...covers]).toEqual([["anilist:2", "https://s4.anilist.co/c.jpg"], ["mal:1", "https://s4.anilist.co/c.jpg"]]);
  });

  it("filters MyAnimeList IDs apart from AniList IDs", async () => {
    const fetch = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify({ data: { Page: { media: [] } } })));

    vi.stubGlobal("fetch", fetch);

    await getAniListCovers({ anilistIds: [], malIds: [7] });
    await getAniListCovers({ anilistIds: [3], malIds: [7] });

    const requests = fetch.mock.calls.map(([, init]) => JSON.parse(init?.body as string));

    expect(requests.map(({ query }) => /media\((\w+):/.exec(query)?.[1])).toEqual(["idMal_in", "id_in", "idMal_in"]);
    expect(requests.map(({ variables }) => variables)).toEqual([{ ids: [7] }, { ids: [3] }, { ids: [7] }]);
  });

  it("asks for at most fifty anime at a time, and nothing without IDs", async () => {
    const fetch = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify({ data: { Page: { media: [] } } })));

    vi.stubGlobal("fetch", fetch);

    await getAniListCovers({ anilistIds: [], malIds: [] });
    expect(fetch).not.toHaveBeenCalled();

    await getAniListCovers({ anilistIds: Array.from({ length: 51 }, (_, i) => i + 1), malIds: [] });

    expect(fetch.mock.calls.map(([, init]) => JSON.parse(init?.body as string).variables.ids.length)).toEqual([50, 1]);
  });

  it("only keeps covers, and links the MyAnimeList ID only when AniList knows it", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      data: { Page: { media: [{ id: 1, idMal: null, coverImage: { large: "https://s4.anilist.co/a.jpg" } }, { id: 2, idMal: 9, coverImage: { large: null } }] } },
    }))));

    expect([...await getAniListCovers({ anilistIds: [1, 2], malIds: [] })]).toEqual([["anilist:1", "https://s4.anilist.co/a.jpg"]]);
  });

  it("finds no covers when AniList reports an error, answers oddly or fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data: { Page: { media: [{ id: 1, idMal: null, coverImage: { large: "https://s4.anilist.co/a.jpg" } }] } } }), { status: 500 })));
    expect((await getAniListCovers({ anilistIds: [1], malIds: [] })).size).toBe(0);

    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data: { Page: { media: "nope" } } }))));
    expect((await getAniListCovers({ anilistIds: [1], malIds: [] })).size).toBe(0);

    stubFetch({});
    expect((await getAniListCovers({ anilistIds: [1], malIds: [] })).size).toBe(0);
  });
});

describe("getEntryCovers", () => {
  const entries = [
    { id: "a", type: 0, title: "A", altTitles: [], anilistId: 2 },
    { id: "b", type: 0, title: "B", altTitles: [], malId: 7 },
    { id: "c", type: 0, title: "C", altTitles: [], anilistId: 9, cover: "https://example.com/own.jpg" },
    { id: "d", type: 1, title: "D", altTitles: [] },
  ] as never;

  it("reuses anime details already cached, and asks AniList for the rest once", async () => {
    await animeInfoCacheItem.setValue({ "anilist:2": { updatedAt: Date.now(), data: { description: "", genres: [], altTitles: [], photo: "https://s4.anilist.co/known.jpg" } } });

    const fetch = vi.fn(async () => new Response(JSON.stringify({ data: { Page: { media: [{ id: 5, idMal: 7, coverImage: { large: "https://s4.anilist.co/b.jpg" } }] } } })));

    vi.stubGlobal("fetch", fetch);

    await expect(getEntryCovers(entries)).resolves.toEqual({ a: "https://s4.anilist.co/known.jpg", b: "https://s4.anilist.co/b.jpg" });
    await expect(getEntryCovers(entries)).resolves.toEqual({ a: "https://s4.anilist.co/known.jpg", b: "https://s4.anilist.co/b.jpg" });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(Object.keys(await coversCacheItem.getValue()).sort()).toEqual(["anilist:2", "mal:7"]);
  });

  it("keeps covers for a week", async () => {
    const week = 7 * 24 * 60 * 60 * 1000;
    const fetch = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify({ data: { Page: { media: [{ id: 2, idMal: null, coverImage: { large: "https://s4.anilist.co/new.jpg" } }] } } })));
    const entry = [{ id: "a", type: 0, title: "A", altTitles: [], anilistId: 2 }] as never;

    vi.stubGlobal("fetch", fetch);

    await coversCacheItem.setValue({ "anilist:2": { updatedAt: Date.now() - week + 60_000, data: "https://s4.anilist.co/old.jpg" } });
    await expect(getEntryCovers(entry)).resolves.toEqual({ a: "https://s4.anilist.co/old.jpg" });
    expect(fetch).not.toHaveBeenCalled();

    await coversCacheItem.setValue({ "anilist:2": { updatedAt: Date.now() - week - 60_000, data: "https://s4.anilist.co/old.jpg" } });
    await expect(getEntryCovers(entry)).resolves.toEqual({ a: "https://s4.anilist.co/new.jpg" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not ask AniList when the cached details cover every anime", async () => {
    await animeInfoCacheItem.setValue({ "anilist:2": { updatedAt: Date.now(), data: { description: "", genres: [], altTitles: [], photo: "https://s4.anilist.co/known.jpg" } } });

    const fetch = vi.fn();

    vi.stubGlobal("fetch", fetch);

    await expect(getEntryCovers([{ id: "a", type: 0, title: "A", altTitles: [], anilistId: 2 }] as never)).resolves.toEqual({ a: "https://s4.anilist.co/known.jpg" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("asks AniList for anime whose cached photo is not a usable address, leaving out those it does not know", async () => {
    await animeInfoCacheItem.setValue({ "anilist:2": { updatedAt: Date.now(), data: { description: "", genres: [], altTitles: [], photo: "/images/graphs/placeholder.png" } } });

    const fetch = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify({ data: { Page: { media: [{ id: 2, idMal: null, coverImage: { large: "https://s4.anilist.co/two.jpg" } }] } } })));

    vi.stubGlobal("fetch", fetch);

    const covers = await getEntryCovers([
      { id: "a", type: 0, title: "A", altTitles: [], anilistId: 2 },
      { id: "b", type: 0, title: "B", altTitles: [], anilistId: 3 },
    ] as never);

    expect(covers).toStrictEqual({ a: "https://s4.anilist.co/two.jpg" });
    expect(JSON.parse(fetch.mock.calls[0]?.[1]?.body as string).variables).toEqual({ ids: [2, 3] });
  });

  it("ignores anime without a usable ID, and prefers AniList's ID over MyAnimeList's", async () => {
    const fetch = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify({ data: { Page: { media: [] } } })));

    vi.stubGlobal("fetch", fetch);

    await getEntryCovers([
      { id: "a", type: 0, title: "A", altTitles: [], anilistId: 0, malId: 0 },
      { id: "b", type: 0, title: "B", altTitles: [], anilistId: -1, malId: 8 },
      { id: "c", type: 0, title: "C", altTitles: [], anilistId: 4, malId: 9 },
      { id: "d", type: 0, title: "D", altTitles: [] },
      { id: "e", type: 0, title: "E", altTitles: [], malId: -3 },
    ] as never);

    expect(Object.keys(await coversCacheItem.getValue())).toEqual([]);
    expect(fetch.mock.calls.map(([, init]) => JSON.parse(init?.body as string))).toEqual([
      expect.objectContaining({ variables: { ids: [4] } }),
      expect.objectContaining({ variables: { ids: [8] } }),
    ]);
  });

  it("uses the thumbnails of YouTube channels", async () => {
    vi.stubEnv("WXT_YOUTUBE_DATA_API_KEY", "api-key");

    const fetch = vi.fn(async (url: URL) => {
      const ids = url.searchParams.get("id")?.split(",") ?? [];

      return new Response(JSON.stringify({
        items: ids.filter(id => id !== "UC-unknown").map(id => ({
          id,
          snippet: { description: "", thumbnails: { medium: { url: `https://yt3.ggpht.com/${id}` } } },
          statistics: { subscriberCount: "1" },
        })),
      }));
    });

    vi.stubGlobal("fetch", fetch);

    const covers = await getEntryCovers([
      { id: "y1", type: 3, title: "Channel", altTitles: [], channelId: "UC-known" },
      { id: "y2", type: 3, title: "Unknown", altTitles: [], channelId: "UC-unknown" },
      { id: "y3", type: 3, title: "No channel", altTitles: [] },
      { id: "y4", type: 3, title: "Own", altTitles: [], channelId: "UC-own", cover: "https://example.com/own.jpg" },
      { id: "m1", type: 1, title: "Movie", altTitles: [] },
      { id: "m2", type: 1, title: "Movie", altTitles: [], channelId: "UC-movie" },
    ] as never);

    expect(covers).toStrictEqual({ y1: "https://yt3.ggpht.com/UC-known" });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect((fetch.mock.calls[0]?.[0] as URL).searchParams.get("id")).toBe("UC-known,UC-unknown");
    vi.unstubAllEnvs();
  });
});
