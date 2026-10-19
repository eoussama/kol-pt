import type { TEntry } from "../schemas/entry/entry.schema";

import { EEntryType } from "../enums/entry-type.enum";
import { Entry } from "./entry";



const movie: TEntry = { id: "e1", title: "Heat", type: EEntryType.MOVIE, altTitles: [] };

afterEach(() => {
  vi.restoreAllMocks();
});

describe("entry data", () => {
  it("exposes the model and its fields", () => {
    const model: TEntry = { ...movie, imdbId: "tt0113277", cover: "https://image.tmdb.org/a.jpg", altTitles: ["Heat (1995)"] };
    const entry = new Entry(model);

    expect(entry.model).toBe(model);
    expect([entry.id, entry.title, entry.type]).toEqual(["e1", "Heat", EEntryType.MOVIE]);
    expect([entry.imdbId, entry.cover]).toEqual(["tt0113277", "https://image.tmdb.org/a.jpg"]);
    expect(entry.altTitles).toEqual(["Heat (1995)"]);
  });

  it("defaults the optional fields", () => {
    const entry = new Entry({ id: "e1", title: "Heat", type: EEntryType.MOVIE } as TEntry);

    expect([entry.imdbId, entry.cover]).toEqual(["", ""]);
    expect(entry.altTitles).toEqual([]);
  });

  it("shortens the title to the shortest alternative", () => {
    expect(new Entry({ ...movie, altTitles: ["Heat (1995)", "H"] }).shortTitle).toBe("H");
  });

  it("keeps the title when there is no alternative", () => {
    expect(new Entry(movie).shortTitle).toBe("Heat");
  });
});

describe("getTypeName", () => {
  it.each([
    [EEntryType.ANIME, "Anime"],
    [EEntryType.MOVIE, "Movie"],
    [EEntryType.CARTOON, "Cartoon"],
    [EEntryType.YOUTUBE, "YouTube"],
    [EEntryType.TV_SHOW, "TV Show"],
  ])("names type %s %s", (type, name) => {
    expect(new Entry({ ...movie, type } as TEntry).getTypeName()).toBe(name);
  });

  it("names an unknown type as nothing", () => {
    expect(new Entry({ ...movie, type: 42 } as unknown as TEntry).getTypeName()).toBe("");
  });
});

describe("entry menu", () => {
  it("offers IMDb", () => {
    const [imdb, ...rest] = new Entry({ ...movie, imdbId: "tt0113277" }).getOptions();

    expect(rest).toEqual([]);
    expect(imdb).toMatchObject({ label: "View on IMDb", iconAlt: "IMDb icon", icon: expect.stringContaining("/images/platforms/imdb.png") });
  });

  it("shows IMDb only when the ID is known", () => {
    expect(new Entry({ ...movie, imdbId: "tt0113277" }).getOptions()[0]?.canShow()).toBe(true);
    expect(new Entry(movie).getOptions()[0]?.canShow()).toBe(false);
  });

  it("opens the title on IMDb", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);

    new Entry({ ...movie, imdbId: "tt0113277" }).getOptions()[0]?.action();

    expect(open).toHaveBeenCalledExactlyOnceWith("https://www.imdb.com/title/tt0113277", "_blank", "noopener,noreferrer");
  });
});

describe("entry search", () => {
  const entry = new Entry({ ...movie, imdbId: "tt0113277", altTitles: ["Heat (1995)"] });

  it.each(["Heat", "heat", "HEAT", "tt0113277", "movie", "1995"])("matches \"%s\"", (query) => {
    expect(entry.match(query)).toBe(true);
  });

  it("matches across the fields it searches, which are kept apart by spaces", () => {
    expect(entry.match("heat tt0113277 movie heat")).toBe(true);
    expect(entry.match("Heat tt0113277")).toBe(true);
    expect(entry.match("tt0113277 Movie")).toBe(true);
    expect(entry.match("Heattt0113277")).toBe(false);
    expect(entry.match("tt0113277Movie")).toBe(false);
  });

  it("does not match something unrelated", () => {
    expect(entry.match("anime")).toBe(false);
    expect(entry.match("Casino")).toBe(false);
  });

  it("matches everything for an empty query", () => {
    expect(entry.match("")).toBe(true);
  });
});
