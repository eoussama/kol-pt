import { readYouTubeContext } from "./context";



describe("readYouTubeContext", () => {
  it("reads the fields that are present", () => {
    expect(readYouTubeContext({ title: "A video", videoId: "abc", altTitles: ["A", "B"] })).toEqual({
      title: "A video",
      videoId: "abc",
      altTitles: ["A", "B"],
    });
  });

  it("leaves absent fields undefined", () => {
    expect(readYouTubeContext({})).toEqual({ title: undefined, videoId: undefined, altTitles: undefined });
  });

  it("reads a missing context as empty", () => {
    expect(readYouTubeContext(undefined)).toEqual({ title: undefined, videoId: undefined, altTitles: undefined });
  });

  it("ignores values of the wrong type", () => {
    expect(readYouTubeContext({ title: 1, videoId: { id: "abc" }, altTitles: "A" })).toEqual({
      title: undefined,
      videoId: undefined,
      altTitles: undefined,
    });
  });

  it("keeps only the alternative titles that are text", () => {
    expect(readYouTubeContext({ altTitles: ["A", 2, null, "B"] }).altTitles).toEqual(["A", "B"]);
  });

  it("keeps an empty text field and an empty list", () => {
    expect(readYouTubeContext({ title: "", videoId: "", altTitles: [] })).toEqual({ title: "", videoId: "", altTitles: [] });
  });
});
