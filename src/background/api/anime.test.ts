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

  it("has nothing without an ID, a match or an answer", async () => {
    const fetch = stubFetch({ anilist: null });

    await expect(getAniListInfo({})).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
    await expect(getAniListInfo({ anilistId: 1 })).resolves.toBeNull();

    stubFetch({});
    await expect(getAniListInfo({ anilistId: 1 })).resolves.toBeNull();
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

  it("does not keep the placeholder, so it asks again", async () => {
    const fetch = stubFetch({});

    await getAnimeInfo({ malId: 1 });
    await getAnimeInfo({ malId: 1 });

    expect(fetch.mock.calls.length).toBeGreaterThan(2);
    await expect(animeInfoCacheItem.getValue()).resolves.toEqual({});
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
});
