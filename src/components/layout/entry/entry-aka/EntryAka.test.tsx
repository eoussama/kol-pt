import { fireEvent, render, screen, within } from "@testing-library/react";
import EntryAka from "./EntryAka";



describe("entryAka", () => {
  it("renders nothing without aliases", () => {
    const { container } = render(<EntryAka altTitles={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("lists every alias with where it comes from", () => {
    render(<EntryAka altTitles={[{ title: "Shingeki no Kyojin", official: true }, { title: "AoT", official: false }]} />);

    expect(screen.getByRole("heading", { name: "Aliases" })).toBeInTheDocument();

    const [official, unofficial] = screen.getAllByRole("listitem");

    expect(within(official!).getByText("Shingeki no Kyojin")).toBeInTheDocument();
    expect(within(official!).getByText("official")).toBeInTheDocument();
    expect(within(unofficial!).getByText("AoT")).toBeInTheDocument();
    expect(within(unofficial!).getByText("kol")).toBeInTheDocument();
  });

  it("explains an official alias when hovering it", async () => {
    render(<EntryAka altTitles={[{ title: "Shingeki no Kyojin", official: true }]} />);

    fireEvent.focus(screen.getByText("Shingeki no Kyojin").parentElement!);

    expect(await screen.findByText("Official title that the Anime is referred to by.")).toBeInTheDocument();
  });

  it("explains an unofficial alias when hovering it", async () => {
    render(<EntryAka altTitles={[{ title: "AoT", official: false }]} />);

    fireEvent.focus(screen.getByText("AoT").parentElement!);

    expect(await screen.findByText("Unofficial title, used by KOL.")).toBeInTheDocument();
  });
});
