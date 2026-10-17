import { EEntryType } from "../enums/entry-type.enum";
import { createEntry } from "./hydrate";
import { Tag } from "./tag";



function tagOf(type: number, label = "12") {
  const entry = createEntry({ id: "e1", type, title: "Severance", altTitles: ["Sev"] } as never);

  return new Tag({ id: "t1", entryId: "e1", label, description: "", startTime: 0, endTime: 60, context: {} }, entry);
}

describe("tag labels by entry type", () => {
  it.each([EEntryType.ANIME, EEntryType.TV_SHOW, EEntryType.CARTOON])("numbers type %s reactions by episode", (type) => {
    expect(tagOf(type).getDetailDescription()).toBe("Episode 12");
    expect(tagOf(type).getShortTitle()).toBe("Sev - 12");
  });

  it.each([EEntryType.MOVIE])("leaves type %s reactions as labelled", (type) => {
    expect(tagOf(type, "Part 2").getDetailDescription()).toBe("Part 2");
    expect(tagOf(type, "Part 2").getShortTitle()).toBe("Part 2");
  });
});

describe("tag hover text", () => {
  it("names the episode and what it is from", () => {
    expect(tagOf(EEntryType.TV_SHOW, "7").getHoverText()).toBe("Episode 7 of Severance");
  });

  it("repeats the name when there is no episode", () => {
    expect(tagOf(EEntryType.MOVIE, "Part 2").getHoverText()).toBe("Severance");
    expect(tagOf(EEntryType.ANIME, "").getHoverText()).toBe("Severance");
  });

  it("prefers the reaction's own description", () => {
    const entry = createEntry({ id: "e1", type: EEntryType.MOVIE, title: "One Piece" } as never);
    const tag = new Tag({ id: "t1", entryId: "e1", label: "1", description: "This was big", startTime: 0, endTime: 60, context: {} }, entry);

    expect(tag.getHoverText()).toBe("This was big");
  });
});
