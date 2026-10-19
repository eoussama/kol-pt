import type { TAnimeEntry } from "../schemas/entry/anime-entry.schema";

import { EEntryType } from "../enums/entry-type.enum";
import { Anime } from "./anime";



const model: TAnimeEntry = { id: "e1", title: "Clevatess", type: EEntryType.ANIME, altTitles: [] };

/**
 * @description
 * Finds an option of an anime's menu by its label.
 *
 * @param anime - The anime
 * @param label - The option's label
 * @returns The option
 */
function optionOf(anime: Anime, label: string) {
  const option = anime.getOptions().find(o => o.label === label);

  if (!option) {
    throw new Error(`No option "${label}"`);
  }

  return option;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("anime IDs", () => {
  it("keeps the IDs it was given", () => {
    const anime = new Anime({ ...model, malId: 57891, anilistId: 170000, kitsuId: "clevatess" });

    expect([anime.malId, anime.anilistId, anime.kitsuId]).toEqual([57891, 170000, "clevatess"]);
  });

  it("marks unknown IDs", () => {
    const anime = new Anime(model);

    expect([anime.malId, anime.anilistId, anime.kitsuId]).toEqual([-1, -1, ""]);
  });
});

describe("anime menu", () => {
  it("lists the anime sites first, then the shared options", () => {
    expect(new Anime({ ...model, imdbId: "tt1" }).getOptions().map(o => o.label)).toEqual([
      "View on MyAnimeList",
      "View on AniList",
      "View on Kitsu",
      "View on IMDb",
    ]);
  });

  it("offers each site only when its ID is known", () => {
    const shown = (anime: Anime) => anime.getOptions().filter(o => o.canShow()).map(o => o.label);

    expect(shown(new Anime(model))).toEqual([]);
    expect(shown(new Anime({ ...model, malId: 1 }))).toEqual(["View on MyAnimeList"]);
    expect(shown(new Anime({ ...model, anilistId: 1 }))).toEqual(["View on AniList"]);
    expect(shown(new Anime({ ...model, kitsuId: "k" }))).toEqual(["View on Kitsu"]);
  });

  it("hides MyAnimeList and AniList for an ID of zero", () => {
    const anime = new Anime({ ...model, malId: 0, anilistId: 0 });

    expect(anime.getOptions().filter(o => o.canShow())).toEqual([]);
  });

  it("opens the anime on each site", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const anime = new Anime({ ...model, malId: 21, anilistId: 22, kitsuId: "one-piece" });

    optionOf(anime, "View on MyAnimeList").action();
    optionOf(anime, "View on AniList").action();
    optionOf(anime, "View on Kitsu").action();

    expect(open.mock.calls.map(([url]) => url)).toEqual([
      "https://myanimelist.net/anime/21",
      "https://anilist.co/anime/22",
      "https://kitsu.io/anime/one-piece",
    ]);
  });

  it("describes each option's icon", () => {
    const anime = new Anime(model);

    expect(optionOf(anime, "View on MyAnimeList")).toMatchObject({ iconAlt: "MAL icon", icon: expect.stringContaining("/images/platforms/mal.png") });
    expect(optionOf(anime, "View on AniList")).toMatchObject({ iconAlt: "AniList icon", icon: expect.stringContaining("/images/platforms/anilist.png") });
    expect(optionOf(anime, "View on Kitsu")).toMatchObject({ iconAlt: "Kitsu icon", icon: expect.stringContaining("/images/platforms/kitsu.png") });
  });
});
