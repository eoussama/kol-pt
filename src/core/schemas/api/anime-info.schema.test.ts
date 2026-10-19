import { AnimeInfoSchema } from "./anime-info.schema";



const info = {
  description: "A fantasy",
  photo: "https://cdn.test/a.jpg",
  genres: ["Fantasy"],
  altTitles: [{ title: "Clevatess: Majuu no Ou", official: true }],
};

describe("animeInfoSchema", () => {
  it("reads an anime's details", () => {
    expect(AnimeInfoSchema.parse(info)).toEqual(info);
  });

  it("accepts an anime without genres or alternative titles", () => {
    expect(AnimeInfoSchema.safeParse({ ...info, genres: [], altTitles: [] }).success).toBe(true);
  });

  it.each(["description", "photo", "genres", "altTitles"])("requires %s", (field) => {
    expect(AnimeInfoSchema.safeParse({ ...info, [field]: undefined }).success).toBe(false);
  });

  it("rejects an alternative title without its flag", () => {
    expect(AnimeInfoSchema.safeParse({ ...info, altTitles: [{ title: "x" }] }).success).toBe(false);
  });

  it("rejects genres that are not text", () => {
    expect(AnimeInfoSchema.safeParse({ ...info, genres: [1] }).success).toBe(false);
  });
});
