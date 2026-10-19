import { createEntry } from "../core/domain/hydrate";
import { EEntryType } from "../core/enums/entry-type.enum";
import { mergeAltTitles } from "./entry.hook";



describe("mergeAltTitles", () => {
  it("lists KOL's titles for any kind of entry", () => {
    const show = createEntry({ id: "e1", type: EEntryType.TV_SHOW, title: "Severance", altTitles: ["Sev", "Severance"] } as never);

    expect(mergeAltTitles(show)).toEqual([{ title: "Sev", official: false }]);
  });

  it("puts official titles first, without blanks or duplicates", () => {
    const anime = createEntry({ id: "e2", type: EEntryType.ANIME, title: "Frieren", altTitles: ["Sousou no Frieren"] } as never);

    expect(mergeAltTitles(anime, [{ title: " Sousou no Frieren ", official: true }, { title: "", official: true }, { title: "葬送のフリーレン", official: true }])).toEqual([
      { title: "Sousou no Frieren", official: true },
      { title: "葬送のフリーレン", official: true },
    ]);
  });
});
