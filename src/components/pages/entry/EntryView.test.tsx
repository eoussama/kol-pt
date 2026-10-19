import type { TEntry } from "../../../core/schemas/entry/entry.schema";
import type { TPost } from "../../../core/schemas/post.schema";

import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { EEntryType } from "../../../core/enums/entry-type.enum";
import { request } from "../../../core/messaging/client";
import { getPlaceholderUrl } from "../../../core/utils/assets";
import { useAuthStore } from "../../../state/auth.state";
import EntryView from "./EntryView";



vi.mock("../../../core/messaging/client", () => ({ request: vi.fn() }));

const COVER_URL = "https://cdn.myanimelist.net/images/anime/1/1.jpg";
const COVER_DATA = "data:image/png;base64,AAAA";

let counter = 0;

/**
 * @description
 * A new entry ID, as entries already shown are kept while the page is open.
 *
 * @returns An ID no test used yet
 */
function nextId(): string {
  counter += 1;

  return `entry-${counter}`;
}

/**
 * @description
 * Builds an anime that is in a post.
 *
 * @param id - The anime's ID
 * @returns The anime and the post
 */
function animeWithPost(id: string): { entry: TEntry; posts: Array<TPost> } {
  return {
    entry: { id, type: EEntryType.ANIME, title: "Frieren", altTitles: ["Sousou no Frieren"], imdbId: "tt22248376", malId: 52991 } as TEntry,
    posts: [{ id: "post-1", title: "Anime Tonight", description: "", thumbnail: "", creationDate: 1000, tags: [{ id: "t1", entryId: id, label: "4", description: "", startTime: 0, endTime: 60, context: {} }] }] as Array<TPost>,
  };
}

/**
 * @description
 * Answers the background requests the view makes.
 *
 * @param entries - The entries the background knows
 * @param posts - The posts the background lists
 */
function answer(entries: Array<TEntry>, posts: Array<TPost> = []): void {
  vi.mocked(request).mockImplementation((async (type: string) => {
    switch (type) {
      case "posts.list": return { posts, entries };

      case "anime.info": return { photo: COVER_URL, genres: ["Fantasy", "Adventure"], description: "An elf mage outlives her party.", altTitles: [{ title: "Frieren: Beyond Journey's End", official: true }] };

      case "images.fetch": return COVER_DATA;

      default: return null;
    }
  }) as never);
}

/**
 * @description
 * The cover behind the entry's head.
 *
 * @param container - What the view rendered into
 * @returns The cover image, if any
 */
function coverOf(container: HTMLElement): HTMLImageElement | null {
  return container.querySelector<HTMLImageElement>("[aria-hidden=true] > img");
}

describe("entryView", () => {
  beforeEach(() => {
    vi.mocked(request).mockReset();
    useAuthStore.setState({ moderator: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows an empty placeholder, not an error, while the entry loads quickly", () => {
    vi.mocked(request).mockReturnValue(new Promise(() => undefined) as never);

    render(<EntryView entryId={nextId()} />);

    const placeholder = screen.getByRole("status", { name: "Loading entry" });

    expect(placeholder).toBeEmptyDOMElement();
    expect(screen.queryByText("Could not retrieve entry")).not.toBeInTheDocument();
  });

  it("shows the skeleton once the entry takes longer than 200 milliseconds", () => {
    vi.useFakeTimers();
    vi.mocked(request).mockReturnValue(new Promise(() => undefined) as never);

    render(<EntryView entryId={nextId()} />);

    act(() => {
      vi.advanceTimersByTime(199);
    });

    expect(screen.getByRole("status", { name: "Loading entry" })).toBeEmptyDOMElement();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    const skeleton = screen.getByRole("status", { name: "Loading entry" });

    expect(skeleton).not.toBeEmptyDOMElement();
    expect(skeleton.querySelector(".grid-cols-2")).toBeNull();
  });

  it("lays the skeleton's links side by side in a dialog", () => {
    vi.useFakeTimers();
    vi.mocked(request).mockReturnValue(new Promise(() => undefined) as never);

    render(<EntryView entryId={nextId()} isDialog />);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByRole("status", { name: "Loading entry" }).querySelector(".grid-cols-2")).not.toBeNull();
  });

  it("shows an error when the entry cannot be found", async () => {
    answer([]);

    render(<EntryView entryId="missing" />);

    expect(await screen.findByText("Could not retrieve entry")).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Loading entry" })).not.toBeInTheDocument();
  });

  it("shows an error when the entry cannot be loaded", async () => {
    vi.mocked(request).mockRejectedValue(new Error("Offline"));

    render(<EntryView entryId={nextId()} />);

    expect(await screen.findByText("Could not retrieve entry")).toBeInTheDocument();
  });

  it("shows the entry with its details, aliases, links and reactions", async () => {
    const id = nextId();
    const { entry, posts } = animeWithPost(id);

    answer([entry], posts);

    render(<EntryView entryId={id} />);

    expect(await screen.findByRole("heading", { name: "Frieren" })).toBeInTheDocument();
    expect(await screen.findByText("An elf mage outlives her party.")).toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Genres" })).getAllByRole("listitem").map(item => item.textContent)).toEqual(["Fantasy", "Adventure"]);
    expect(screen.getByRole("heading", { name: "Aliases" })).toBeInTheDocument();
    expect(screen.getByText("Frieren: Beyond Journey's End")).toBeInTheDocument();
    expect(screen.getByText("Sousou no Frieren")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View on MyAnimeList" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View on IMDb" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Reactions/ })).toBeInTheDocument();
    expect(screen.getByText("Episode 4")).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Loading entry" })).not.toBeInTheDocument();
  });

  it("shows the back arrow only when it can go back", async () => {
    const id = nextId();
    const onBack = vi.fn();

    answer([animeWithPost(id).entry]);

    const { rerender } = render(<EntryView entryId={id} />);

    await screen.findByRole("heading", { name: "Frieren" });

    expect(screen.queryByRole("button", { name: "Back to entries" })).not.toBeInTheDocument();

    rerender(<EntryView entryId={id} onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: "Back to entries" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("shows no cover until it is fetched", async () => {
    const id = nextId();
    const { entry } = animeWithPost(id);

    answer([entry]);

    const respond = vi.mocked(request).getMockImplementation()!;

    // A cover no test fetched yet, as fetched ones are kept while the page is open
    vi.mocked(request).mockImplementation((async (type: string, payload: never) => {
      switch (type) {
        case "images.fetch": return new Promise(() => undefined);

        case "anime.info": return { ...(await respond(type, payload)) as object, photo: "https://cdn.myanimelist.net/images/anime/9/9.jpg" };

        default: return respond(type as never, payload);
      }
    }) as never);

    const { container } = render(<EntryView entryId={id} />);

    await screen.findByRole("heading", { name: "Frieren" });

    expect(coverOf(container)).toBeNull();
  });

  it("fades the cover in once it has loaded", async () => {
    const id = nextId();

    answer([animeWithPost(id).entry]);

    const { container } = render(<EntryView entryId={id} />);

    await waitFor(() => expect(coverOf(container)).toHaveAttribute("src", COVER_DATA));
    expect(coverOf(container)).toHaveClass("opacity-0");

    fireEvent.load(coverOf(container)!);

    expect(coverOf(container)).toHaveClass("opacity-100");
    expect(coverOf(container)).not.toHaveClass("opacity-0");
  });

  it("shows the placeholder when the cover fails to load", async () => {
    const id = nextId();

    answer([animeWithPost(id).entry]);

    const { container } = render(<EntryView entryId={id} />);

    await waitFor(() => expect(coverOf(container)).toHaveAttribute("src", COVER_DATA));
    fireEvent.error(coverOf(container)!);

    expect(coverOf(container)).toHaveAttribute("src", getPlaceholderUrl());
  });

  it("shows an entry shown before at once, with its cover", async () => {
    const id = nextId();

    answer([animeWithPost(id).entry]);

    const first = render(<EntryView entryId={id} />);

    await waitFor(() => expect(coverOf(first.container)).toHaveAttribute("src", COVER_DATA));
    first.unmount();

    const { container } = render(<EntryView entryId={id} />);

    expect(screen.getByRole("heading", { name: "Frieren" })).toBeInTheDocument();
    expect(coverOf(container)).toHaveAttribute("src", COVER_DATA);
    expect(coverOf(container)).toHaveClass("opacity-100");
  });

  it("fades the cover into the page behind it, or into the dialog", async () => {
    const id = nextId();

    answer([animeWithPost(id).entry]);

    const popup = render(<EntryView entryId={id} />);

    await screen.findByRole("heading", { name: "Frieren" });

    expect(popup.container.querySelector(".via-background\\/50")).not.toBeNull();
    expect(popup.container.querySelector(".via-popover\\/50")).toBeNull();
    popup.unmount();

    const dialog = render(<EntryView entryId={id} isDialog />);

    expect(dialog.container.querySelector(".via-popover\\/50")).not.toBeNull();
    expect(dialog.container.querySelector(".via-background\\/50")).toBeNull();
  });

  it("offers no editing to anyone but moderators", async () => {
    const id = nextId();

    answer([animeWithPost(id).entry]);

    render(<EntryView entryId={id} />);
    await screen.findByRole("heading", { name: "Frieren" });

    expect(screen.queryByRole("button", { name: "Edit entry" })).not.toBeInTheDocument();
  });

  describe("as a moderator", () => {
    beforeEach(() => {
      useAuthStore.setState({ moderator: true });
    });

    it("opens the entry's editor", async () => {
      const id = nextId();

      answer([animeWithPost(id).entry]);

      render(<EntryView entryId={id} />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      fireEvent.click(await screen.findByRole("button", { name: "Edit entry" }));

      expect(await screen.findByRole("dialog", { name: "Edit entry" })).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: /Title/ })).toHaveValue("Frieren");
    });

    it("closes the editor without reloading the entry when nothing was saved", async () => {
      const id = nextId();

      answer([animeWithPost(id).entry]);

      render(<EntryView entryId={id} />);
      fireEvent.click(await screen.findByRole("button", { name: "Edit entry" }));
      fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(vi.mocked(request).mock.calls.filter(([type]) => type === "posts.list")).toHaveLength(1);
    });

    it("reloads the entry once its edit is saved", async () => {
      const id = nextId();
      const { entry } = animeWithPost(id);

      answer([entry]);

      render(<EntryView entryId={id} />);
      fireEvent.click(await screen.findByRole("button", { name: "Edit entry" }));
      fireEvent.change(await screen.findByRole("textbox", { name: /Title/ }), { target: { value: "Sousou no Frieren" } });
      answer([{ ...entry, title: "Sousou no Frieren" } as TEntry]);
      fireEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(await screen.findByRole("heading", { name: "Sousou no Frieren" })).toBeInTheDocument();
      expect(request).toHaveBeenCalledWith("entries.save", { entry: expect.objectContaining({ id, title: "Sousou no Frieren" }) });
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(vi.mocked(request).mock.calls.filter(([type]) => type === "posts.list")).toHaveLength(2);
    });
  });
});
