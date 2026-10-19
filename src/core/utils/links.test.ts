import {
  openAniList,
  openDiscord,
  openExternal,
  openIMDb,
  openKitsu,
  openMAL,
  openPassione,
  openPatreon,
  openPost,
  openProject,
  openYouTubeChannel,
  openYouTubeVideo,
} from "./links";



let open: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  open = vi.spyOn(window, "open").mockReturnValue(null);
});

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * @description
 * The URL the last link opened.
 *
 * @returns The URL
 */
function openedUrl(): string {
  return open.mock.calls.at(-1)?.[0] as string;
}

describe("openExternal", () => {
  it("opens a new tab that cannot reach this page", () => {
    openExternal("https://example.test");

    expect(open).toHaveBeenCalledExactlyOnceWith("https://example.test", "_blank", "noopener,noreferrer");
  });
});

describe("fixed links", () => {
  it.each([
    ["project", openProject, "https://github.com/EOussama/kol-pt"],
    ["Discord", openDiscord, "https://discord.com/invite/5zGuUpwH3K"],
    ["Passione Club", openPassione, "https://discord.com/channels/177656523135254529/823055567064530954"],
  ])("opens the %s page", (_name, opener, url) => {
    opener();

    expect(open).toHaveBeenCalledExactlyOnceWith(url, "_blank", "noopener,noreferrer");
  });

  it("opens the creator's Patreon page", () => {
    openPatreon();

    expect(openedUrl()).toMatch(/^https?:\/\/[^/]+\/[^/]+$/);
    expect(openedUrl()).toContain("patreon");
  });
});

describe("openPost", () => {
  it("opens the post alone", () => {
    openPost("171089353");

    expect(new URL(openedUrl()).pathname).toBe("/posts/171089353");
    expect(new URL(openedUrl()).search).toBe("");
  });

  it("encodes the post's ID", () => {
    openPost("a/b c");

    expect(new URL(openedUrl()).pathname).toBe("/posts/a%2Fb%20c");
  });

  it("positions the video at a reaction", () => {
    openPost("1", "t9");

    expect(new URL(openedUrl()).searchParams.get("reactionId")).toBe("t9");
    expect(new URL(openedUrl()).searchParams.has("resumeAt")).toBe(false);
  });

  it("resumes at a saved position, rounded down", () => {
    openPost("1", undefined, 95.9);

    expect(new URL(openedUrl()).searchParams.get("resumeAt")).toBe("95");
    expect(new URL(openedUrl()).searchParams.has("reactionId")).toBe(false);
  });

  it("resumes from the start", () => {
    openPost("1", undefined, 0);

    expect(new URL(openedUrl()).searchParams.get("resumeAt")).toBe("0");
  });

  it("carries both the reaction and the position", () => {
    openPost("1", "t9", 12);

    const { searchParams } = new URL(openedUrl());

    expect(searchParams.get("reactionId")).toBe("t9");
    expect(searchParams.get("resumeAt")).toBe("12");
  });

  it("ignores an empty reaction", () => {
    openPost("1", "");

    expect(new URL(openedUrl()).searchParams.has("reactionId")).toBe(false);
  });
});

describe("title links", () => {
  it.each([
    ["IMDb", () => openIMDb("tt0111161"), "https://www.imdb.com/title/tt0111161"],
    ["MyAnimeList", () => openMAL(21), "https://myanimelist.net/anime/21"],
    ["AniList", () => openAniList(21), "https://anilist.co/anime/21"],
    ["Kitsu", () => openKitsu("one-piece"), "https://kitsu.io/anime/one-piece"],
    ["a YouTube video", () => openYouTubeVideo("dQw4w9WgXcQ"), "https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
    ["a YouTube channel", () => openYouTubeChannel("KingOfLightning"), "https://www.youtube.com/@KingOfLightning"],
  ])("opens %s", (_name, opener, url) => {
    opener();

    expect(open).toHaveBeenCalledExactlyOnceWith(url, "_blank", "noopener,noreferrer");
  });

  it.each([
    ["IMDb", () => openIMDb("a/b"), "https://www.imdb.com/title/a%2Fb"],
    ["Kitsu", () => openKitsu("a b"), "https://kitsu.io/anime/a%20b"],
    ["a YouTube video", () => openYouTubeVideo("a&b"), "https://www.youtube.com/watch?v=a%26b"],
    ["a YouTube channel", () => openYouTubeChannel("a/b"), "https://www.youtube.com/@a%2Fb"],
  ])("encodes the ID of %s", (_name, opener, url) => {
    opener();

    expect(openedUrl()).toBe(url);
  });
});
