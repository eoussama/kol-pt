import type { TEntry } from "../core/schemas/entry/entry.schema";
import type { TPost } from "../core/schemas/post.schema";

import { act, renderHook, waitFor } from "@testing-library/react";
import { createEntry } from "../core/domain/hydrate";
import { EEntryType } from "../core/enums/entry-type.enum";
import { request } from "../core/messaging/client";
import { getPlaceholderUrl } from "../core/utils/assets";
import { mergeAltTitles, useEntry } from "./entry.hook";



vi.mock("../core/messaging/client", () => ({ request: vi.fn() }));

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

const requestMock = vi.mocked(request);

/**
 * @description
 * A new entry ID. The hook keeps the entries it showed while the page is open,
 * so every test uses entries of its own.
 *
 * @returns The ID
 */
const nextId = (() => {
  let count = 0;

  return () => `entry-${++count}`;
})();

/**
 * @description
 * A reaction to an entry.
 *
 * @param id - The reaction ID
 * @param entryId - The entry reacted to
 * @returns The reaction's data
 */
function tag(id: string, entryId: string) {
  return { id, entryId, label: id, description: "", startTime: 0, endTime: 60, context: {} };
}

/**
 * @description
 * Answers the background's requests: the posts and entries, and the third-party details.
 *
 * @param entries - Every entry
 * @param posts - Every post
 * @param details - Answers to the detail requests, by request type; an error is thrown instead
 */
function serve(entries: Array<TEntry>, posts: Array<TPost>, details: Record<string, unknown> = {}) {
  requestMock.mockImplementation((async (type: string) => {
    if (type === "posts.list") {
      return { posts, entries };
    }

    const answer = details[type];

    if (answer instanceof Error) {
      throw answer;
    }

    return answer;
  }) as never);
}

describe("useEntry", () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it("has nothing to load without an entry", () => {
    const { result } = renderHook(() => useEntry(""));

    expect(result.current).toEqual({ loading: false, entry: null, photo: getPlaceholderUrl(), description: "", subscribers: 0, genres: [], altTitles: [], reactions: [] });
    expect(requestMock).not.toHaveBeenCalled();
  });

  it("loads the entry with its reactions, newest first, and KOL's titles", async () => {
    const id = nextId();
    const other = nextId();

    serve(
      [{ id, title: "Severance", type: EEntryType.TV_SHOW, altTitles: ["Sev"] }, { id: other, title: "Other", type: EEntryType.MOVIE, altTitles: [] }],
      [
        { id: "old", title: "Old", description: "", thumbnail: "", creationDate: 1000, tags: [tag("t1", id), tag("t2", other)] },
        { id: "new", title: "New", description: "", thumbnail: "", creationDate: 2000, tags: [tag("t3", id)] },
      ] as Array<TPost>,
    );

    const { result } = renderHook(() => useEntry(id));

    expect(result.current.loading).toBe(true);
    expect(result.current.entry).toBeNull();
    expect(result.current.photo).toBe(getPlaceholderUrl());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(requestMock).toHaveBeenCalledExactlyOnceWith("posts.list", {});
    expect(result.current.entry?.id).toBe(id);
    expect(result.current.reactions.map(r => [r.postId, r.tag.id])).toEqual([["new", "t3"], ["old", "t1"]]);
    expect(result.current.altTitles).toEqual([{ title: "Sev", official: false }]);
    expect(result.current.photo).toBe(getPlaceholderUrl());
  });

  it("shows the entry's own cover", async () => {
    const id = nextId();

    serve([{ id, title: "Severance", type: EEntryType.TV_SHOW, cover: "https://image.tmdb.org/s.jpg", altTitles: [] }], []);

    const { result } = renderHook(() => useEntry(id));

    await waitFor(() => expect(result.current.photo).toBe("https://image.tmdb.org/s.jpg"));
  });

  it("stops loading, with no entry, when it does not exist", async () => {
    const id = nextId();

    serve([], []);

    const { result } = renderHook(() => useEntry(id));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entry).toBeNull();
    expect(result.current.reactions).toEqual([]);
  });

  it("does not remember entries that do not exist", async () => {
    const id = nextId();

    serve([], []);

    const first = renderHook(() => useEntry(id));

    await waitFor(() => expect(first.result.current.loading).toBe(false));
    first.unmount();

    expect(renderHook(() => useEntry(id)).result.current.loading).toBe(true);
  });

  it("stops loading when the posts cannot be loaded", async () => {
    const id = nextId();

    requestMock.mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => useEntry(id));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entry).toBeNull();
  });

  describe("anime", () => {
    const info = {
      description: "A mage",
      photo: "https://cdn.myanimelist.net/f.jpg",
      genres: ["Fantasy"],
      altTitles: [{ title: "Sousou no Frieren", official: true }, { title: "Frieren", official: true }],
    };

    it("adds the details from AniList and MyAnimeList, official titles first", async () => {
      const id = nextId();

      serve([{ id, title: "Frieren", type: EEntryType.ANIME, malId: 52991, anilistId: 154587, altTitles: ["Frieren: Beyond Journey's End"] }], [], { "anime.info": info });

      const { result } = renderHook(() => useEntry(id));

      await waitFor(() => expect(result.current.description).toBe("A mage"));
      expect(requestMock).toHaveBeenCalledWith("anime.info", { malId: 52991, anilistId: 154587 });
      expect(result.current.photo).toBe("https://cdn.myanimelist.net/f.jpg");
      expect(result.current.genres).toEqual(["Fantasy"]);
      expect(result.current.altTitles).toEqual([
        { title: "Sousou no Frieren", official: true },
        { title: "Frieren: Beyond Journey's End", official: false },
      ]);
    });

    it("asks by MyAnimeList ID alone when there is no AniList ID", async () => {
      const id = nextId();

      serve([{ id, title: "Frieren", type: EEntryType.ANIME, malId: 52991, altTitles: [] }], [], { "anime.info": info });

      renderHook(() => useEntry(id));

      await waitFor(() => expect(requestMock).toHaveBeenCalledWith("anime.info", { malId: 52991 }));
    });

    it("asks by AniList ID alone when there is no MyAnimeList ID", async () => {
      const id = nextId();

      serve([{ id, title: "Frieren", type: EEntryType.ANIME, anilistId: 154587, altTitles: [] }], [], { "anime.info": info });

      renderHook(() => useEntry(id));

      await waitFor(() => expect(requestMock).toHaveBeenCalledWith("anime.info", { anilistId: 154587 }));
    });

    it("treats an ID of zero as no ID", async () => {
      const [none, byAniList, byMyAnimeList] = [nextId(), nextId(), nextId()];

      serve([
        { id: none, title: "None", type: EEntryType.ANIME, malId: 0, anilistId: 0, altTitles: [] },
        { id: byAniList, title: "AniList", type: EEntryType.ANIME, malId: 0, anilistId: 7, altTitles: [] },
        { id: byMyAnimeList, title: "MyAnimeList", type: EEntryType.ANIME, malId: 8, anilistId: 0, altTitles: [] },
      ], [], { "anime.info": info });

      const first = renderHook(() => useEntry(none));

      await waitFor(() => expect(first.result.current.loading).toBe(false));
      expect(requestMock).not.toHaveBeenCalledWith("anime.info", expect.anything());

      renderHook(() => useEntry(byAniList));
      await waitFor(() => expect(requestMock).toHaveBeenCalledWith("anime.info", { anilistId: 7 }));

      renderHook(() => useEntry(byMyAnimeList));
      await waitFor(() => expect(requestMock).toHaveBeenCalledWith("anime.info", { malId: 8 }));
      expect(requestMock).not.toHaveBeenCalledWith("anime.info", expect.objectContaining({ malId: 0 }));
      expect(requestMock).not.toHaveBeenCalledWith("anime.info", expect.objectContaining({ anilistId: 0 }));
    });

    it("has no details to ask for without either ID", async () => {
      const id = nextId();

      serve([{ id, title: "Frieren", type: EEntryType.ANIME, altTitles: ["Sousou"] }], []);

      const { result } = renderHook(() => useEntry(id));

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(requestMock).not.toHaveBeenCalledWith("anime.info", expect.anything());
      expect(result.current.altTitles).toEqual([{ title: "Sousou", official: false }]);
    });

    it("prefers the entry's own cover to the one from the details", async () => {
      const id = nextId();

      serve([{ id, title: "Frieren", type: EEntryType.ANIME, malId: 1, cover: "https://image.tmdb.org/own.jpg", altTitles: [] }], [], { "anime.info": info });

      const { result } = renderHook(() => useEntry(id));

      await waitFor(() => expect(result.current.description).toBe("A mage"));
      expect(result.current.photo).toBe("https://image.tmdb.org/own.jpg");
    });

    it("falls back to the placeholder when the details have no photo", async () => {
      const id = nextId();

      serve([{ id, title: "Frieren", type: EEntryType.ANIME, malId: 1, altTitles: [] }], [], { "anime.info": { ...info, photo: "" } });

      const { result } = renderHook(() => useEntry(id));

      await waitFor(() => expect(result.current.description).toBe("A mage"));
      expect(result.current.photo).toBe(getPlaceholderUrl());
    });

    it("still shows the entry when its details cannot be loaded", async () => {
      const id = nextId();
      const posts = [{ id: "p", title: "P", description: "", thumbnail: "", creationDate: 1, tags: [tag("t1", id)] }] as Array<TPost>;

      serve([{ id, title: "Frieren", type: EEntryType.ANIME, malId: 1, altTitles: ["Sousou"] }], posts, { "anime.info": new Error("rate limited") });

      const { result } = renderHook(() => useEntry(id));

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.entry?.id).toBe(id);
      expect(result.current.reactions).toHaveLength(1);
      expect(result.current.altTitles).toEqual([{ title: "Sousou", official: false }]);
      expect(result.current.description).toBe("");
      expect(result.current.photo).toBe(getPlaceholderUrl());
    });
  });

  describe("youTube channels", () => {
    it("adds the channel's details", async () => {
      const id = nextId();

      serve([{ id, title: "Channel", type: EEntryType.YOUTUBE, channelId: "UC1", altTitles: [] }], [], { "youtube.channel": { description: "Videos", thumbnail: "https://ytimg.com/t.jpg", subscribers: 1200 } });

      const { result } = renderHook(() => useEntry(id));

      await waitFor(() => expect(result.current.description).toBe("Videos"));
      expect(requestMock).toHaveBeenCalledWith("youtube.channel", { channelId: "UC1" });
      expect(result.current.photo).toBe("https://ytimg.com/t.jpg");
      expect(result.current.subscribers).toBe(1200);
    });

    it("counts no subscribers when the channel hides them", async () => {
      const id = nextId();

      serve([{ id, title: "Channel", type: EEntryType.YOUTUBE, channelId: "UC1", altTitles: [] }], [], { "youtube.channel": { description: "Videos", thumbnail: "https://ytimg.com/t.jpg" } });

      const { result } = renderHook(() => useEntry(id));

      await waitFor(() => expect(result.current.description).toBe("Videos"));
      expect(result.current.subscribers).toBe(0);
    });

    it("has no details to ask for without a channel ID", async () => {
      const id = nextId();

      serve([{ id, title: "Channel", type: EEntryType.YOUTUBE, handle: "channel", altTitles: [] }], []);

      const { result } = renderHook(() => useEntry(id));

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(requestMock).not.toHaveBeenCalledWith("youtube.channel", expect.anything());
    });
  });

  describe("entries shown before", () => {
    it("shows an entry already shown at once, and refreshes it quietly", async () => {
      const id = nextId();

      serve([{ id, title: "Severance", type: EEntryType.TV_SHOW, altTitles: [] }], []);

      const first = renderHook(() => useEntry(id));

      await waitFor(() => expect(first.result.current.loading).toBe(false));
      first.unmount();

      serve([{ id, title: "Severance S2", type: EEntryType.TV_SHOW, altTitles: [] }], []);

      const second = renderHook(() => useEntry(id));

      expect(second.result.current.loading).toBe(false);
      expect(second.result.current.entry?.title).toBe("Severance");

      await waitFor(() => expect(second.result.current.entry?.title).toBe("Severance S2"));
    });

    it("drops an entry that no longer exists when it is loaded again", async () => {
      const id = nextId();

      serve([{ id, title: "Severance", type: EEntryType.TV_SHOW, altTitles: [] }], []);

      const { result, rerender } = renderHook(({ revision }) => useEntry(id, revision), { initialProps: { revision: 0 } });

      await waitFor(() => expect(result.current.entry?.title).toBe("Severance"));

      serve([], []);
      rerender({ revision: 1 });

      await waitFor(() => expect(result.current.entry).toBeNull());
      expect(result.current.loading).toBe(false);
    });

    it("loads the entry again when the revision changes, e.g. once it is edited", async () => {
      const id = nextId();

      serve([{ id, title: "Severance", type: EEntryType.TV_SHOW, altTitles: [] }], []);

      const { result, rerender } = renderHook(({ revision }) => useEntry(id, revision), { initialProps: { revision: 0 } });

      await waitFor(() => expect(result.current.entry?.title).toBe("Severance"));

      serve([{ id, title: "Severance (edited)", type: EEntryType.TV_SHOW, altTitles: [] }], []);
      rerender({ revision: 1 });

      expect(result.current.entry?.title).toBe("Severance");
      await waitFor(() => expect(result.current.entry?.title).toBe("Severance (edited)"));
    });

    it("starts over, loading, for another entry", async () => {
      const [one, two] = [nextId(), nextId()];

      serve([
        { id: one, title: "One", type: EEntryType.MOVIE, altTitles: [] },
        { id: two, title: "Two", type: EEntryType.MOVIE, altTitles: [] },
      ], []);

      const { result, rerender } = renderHook(({ id }) => useEntry(id), { initialProps: { id: one } });

      await waitFor(() => expect(result.current.entry?.title).toBe("One"));

      rerender({ id: two });
      expect(result.current.entry).toBeNull();
      expect(result.current.loading).toBe(true);

      await waitFor(() => expect(result.current.entry?.title).toBe("Two"));
    });

    it("ignores an entry that finishes loading after the page moved on, but remembers it", async () => {
      const [one, two] = [nextId(), nextId()];
      let release: () => void = () => undefined;
      const entries: Array<TEntry> = [
        { id: one, title: "One", type: EEntryType.MOVIE, altTitles: [] },
        { id: two, title: "Two", type: EEntryType.MOVIE, altTitles: [] },
      ];

      requestMock.mockImplementationOnce((() => new Promise((resolve) => {
        release = () => resolve({ posts: [], entries });
      })) as never);

      const { result, rerender } = renderHook(({ id }) => useEntry(id), { initialProps: { id: one } });

      serve(entries, []);
      rerender({ id: two });
      await waitFor(() => expect(result.current.entry?.title).toBe("Two"));

      await act(async () => {
        release();
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      expect(result.current.entry?.title).toBe("Two");

      expect(renderHook(() => useEntry(one)).result.current.entry?.title).toBe("One");
    });

    it("ignores a failed load after the page moved on", async () => {
      const [one, two] = [nextId(), nextId()];
      let fail: (reason: Error) => void = () => undefined;

      requestMock.mockImplementationOnce((() => new Promise((_resolve, reject) => {
        fail = reject;
      })) as never);

      const { result, rerender } = renderHook(({ id }) => useEntry(id), { initialProps: { id: one } });

      requestMock.mockImplementation((() => new Promise(() => undefined)) as never);
      rerender({ id: two });

      await act(async () => {
        fail(new Error("offline"));
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(true);
    });
  });
});
