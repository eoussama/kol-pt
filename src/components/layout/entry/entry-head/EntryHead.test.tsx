import { fireEvent, render, screen } from "@testing-library/react";
import { createEntry } from "../../../../core/domain/hydrate";
import { EEntryType } from "../../../../core/enums/entry-type.enum";
import EntryHead from "./EntryHead";



const anime = createEntry({ id: "e1", type: EEntryType.ANIME, title: "Frieren: Beyond Journey's End" } as never);
const channel = createEntry({ id: "e2", type: EEntryType.YOUTUBE, title: "Some Channel" } as never);

/**
 * @description
 * Renders the head with sensible defaults.
 *
 * @param props - What to override
 * @returns The render result
 */
function renderHead(props: Partial<Parameters<typeof EntryHead>[0]> = {}) {
  return render(<EntryHead entry={anime} loading={false} subscribers={0} description="A story" genres={[]} {...props} />);
}

describe("entryHead", () => {
  it("shows the entry's type, title and description", () => {
    renderHead();

    expect(screen.getByText("Anime")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Frieren: Beyond Journey's End" })).toBeInTheDocument();
    expect(screen.getByText("A story")).toBeInTheDocument();
  });

  it("shows no subscribers for entries other than channels", () => {
    renderHead({ subscribers: 12_500 });

    expect(screen.queryByText(/subscribers/)).not.toBeInTheDocument();
  });

  it("shows a channel's subscribers in a short form", () => {
    renderHead({ entry: channel, subscribers: 12_500 });

    expect(screen.getByText("YouTube")).toBeInTheDocument();
    expect(screen.getByText("12.5K subscribers")).toBeInTheDocument();
  });

  it("lists the genres", () => {
    renderHead({ genres: ["Fantasy", "Adventure"] });

    const genres = screen.getByRole("list", { name: "Genres" });

    expect(genres.textContent).toBe("FantasyAdventure");
  });

  it("has no genre list without genres", () => {
    renderHead();

    expect(screen.queryByRole("list", { name: "Genres" })).not.toBeInTheDocument();
  });

  it("shows placeholders instead of the description while loading", () => {
    const { container } = renderHead({ loading: true });

    expect(screen.queryByText("A story")).not.toBeInTheDocument();
    expect(container.querySelectorAll("[data-slot=skeleton]").length).toBeGreaterThan(3);
  });

  it("shows no placeholders once loaded", () => {
    const { container } = renderHead();

    expect(container.querySelector("[data-slot=skeleton]")).toBeNull();
  });

  it("has a back button only when it can go back", () => {
    const onBack = vi.fn();
    const { rerender } = renderHead();

    expect(screen.queryByRole("button", { name: "Back to entries" })).not.toBeInTheDocument();

    rerender(<EntryHead entry={anime} loading={false} subscribers={0} description="A story" genres={[]} onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: "Back to entries" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
