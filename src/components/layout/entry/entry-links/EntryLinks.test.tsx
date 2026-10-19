import { fireEvent, render, screen } from "@testing-library/react";
import { createEntry } from "../../../../core/domain/hydrate";
import { EEntryType } from "../../../../core/enums/entry-type.enum";
import EntryLinks from "./EntryLinks";



/**
 * @description
 * Builds an anime entry with links to a few sites.
 *
 * @param extra - What to add to, or override in, the anime's data
 * @returns The entry
 */
function anime(extra: Record<string, unknown> = {}) {
  return createEntry({ id: "e1", type: EEntryType.ANIME, title: "Frieren", malId: 52991, anilistId: 154587, kitsuId: "", imdbId: "", ...extra } as never);
}

describe("entryLinks", () => {
  let open: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    open = vi.spyOn(window, "open").mockImplementation(() => null);
  });

  afterEach(() => {
    open.mockRestore();
  });

  it("renders nothing for an entry without links", () => {
    const { container } = render(<EntryLinks entry={createEntry({ id: "e1", type: EEntryType.MOVIE, title: "Dune" } as never)} isDialog={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("lists only the links the entry has", () => {
    render(<EntryLinks entry={anime()} isDialog={false} />);

    expect(screen.getAllByRole("button").map(button => button.textContent)).toEqual(["View on MyAnimeList", "View on AniList"]);
  });

  it("opens a link in a new tab", () => {
    render(<EntryLinks entry={anime()} isDialog={false} />);

    fireEvent.click(screen.getByRole("button", { name: "View on AniList" }));

    expect(open).toHaveBeenCalledWith("https://anilist.co/anime/154587", "_blank", "noopener,noreferrer");
  });

  it("shows the links side by side in a dialog, and stacked otherwise", () => {
    const { container, rerender } = render(<EntryLinks entry={anime()} isDialog={true} />);

    expect(container.querySelector("section")).toHaveClass("grid", "grid-cols-2");

    rerender(<EntryLinks entry={anime()} isDialog={false} />);
    expect(container.querySelector("section")).not.toHaveClass("grid-cols-2");
  });

  it("follows the entry it is given", () => {
    const { rerender } = render(<EntryLinks entry={anime()} isDialog={false} />);

    rerender(<EntryLinks entry={anime({ id: "e2", malId: -1, anilistId: -1, imdbId: "tt0000001" })} isDialog={false} />);

    expect(screen.getAllByRole("button").map(button => button.textContent)).toEqual(["View on IMDb"]);
  });
});
