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

  it("ignores blank descriptions and spaces around the label", () => {
    const entry = createEntry({ id: "e1", type: EEntryType.TV_SHOW, title: "Severance" } as never);
    const tag = new Tag({ id: "t1", entryId: "e1", label: " 7 ", description: "   ", startTime: 0, endTime: 60, context: {} }, entry);

    expect(tag.getHoverText()).toBe("Episode 7 of Severance");
  });

  it("trims the reaction's own description", () => {
    const tag = new Tag({ id: "t1", entryId: "e1", label: "1", description: "  This was big \n", startTime: 0, endTime: 60, context: {} }, null);

    expect(tag.getHoverText()).toBe("This was big");
  });

  it("prefers the reaction's own description", () => {
    const entry = createEntry({ id: "e1", type: EEntryType.MOVIE, title: "One Piece" } as never);
    const tag = new Tag({ id: "t1", entryId: "e1", label: "1", description: "This was big", startTime: 0, endTime: 60, context: {} }, entry);

    expect(tag.getHoverText()).toBe("This was big");
  });
});

describe("tag timing", () => {
  it("reads the start time as a timestamp", () => {
    const tag = new Tag({ id: "t1", entryId: "e1", label: "1", description: "", startTime: 3725, endTime: 3800, context: {} }, null);

    expect(tag.getReadableStartTime()).toBe("1:02:05");
  });

  it("reads the duration in words", () => {
    const tag = new Tag({ id: "t1", entryId: "e1", label: "1", description: "", startTime: 3725, endTime: 3800, context: {} }, null);

    expect(tag.getReadableDuration()).toBe("1 minute 15 seconds");
  });
});

describe("reactions without an entry", () => {
  it("names the reaction after its label", () => {
    const tag = new Tag({ id: "t1", entryId: "missing", label: "7", description: "", startTime: 0, endTime: 60, context: {} }, null);

    expect(tag.getHoverText()).toBe("7");
    expect(tag.getDetailDescription()).toBe("7");
  });
});

describe("youTube reactions without alternative titles", () => {
  it("keeps the label", () => {
    const entry = createEntry({ id: "e1", type: EEntryType.YOUTUBE, title: "Some Channel" } as never);
    const tag = new Tag({ id: "t1", entryId: "e1", label: "A video", description: "", startTime: 0, endTime: 60, context: {} }, entry);

    expect(tag.getShortTitle()).toBe("A video");
  });
});
