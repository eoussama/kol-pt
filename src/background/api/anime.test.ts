import { getAniListInfo, toPlainText } from "./anilist";
import { getAnimeInfo } from "./anime";
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
