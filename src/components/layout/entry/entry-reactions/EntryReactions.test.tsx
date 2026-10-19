import { fireEvent, render, screen } from "@testing-library/react";
import { Tag } from "../../../../core/domain/tag";
import EntryReactions from "./EntryReactions";



function reaction(label: string, year: number) {
  return { postId: `p${label}`, date: new Date(year, 0, 1), tag: new Tag({ id: label, entryId: "e1", label, description: "", startTime: 0, endTime: 60, context: {} }, null) };
}

const reactions = [reaction("Opening", 2024), reaction("Finale", 2025), reaction("Opening 2", 2025)];

function renderList(list = reactions) {
  return render(<EntryReactions entry={null as never} reactions={list} />);
}

describe("entryReactions search", () => {
  it("filters the reactions as the user types and says when nothing matches", () => {
    renderList();

    expect(screen.getAllByRole("listitem")).toHaveLength(3);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search reactions" }), { target: { value: "open" } });
    expect(screen.getAllByRole("listitem")).toHaveLength(2);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search reactions" }), { target: { value: "zzz" } });
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(screen.getByText(/No reactions match/)).toBeInTheDocument();
  });

  it("has no search for a single reaction", () => {
    renderList([reaction("Only", 2024)]);

    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("shows no heading for an entry without reactions", () => {
    renderList([]);

    expect(screen.queryByText("Reactions")).not.toBeInTheDocument();
  });
});

describe("entryReactions list", () => {
  let open: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    open = vi.spyOn(window, "open").mockImplementation(() => null);
  });

  afterEach(() => {
    open.mockRestore();
  });

  it("counts the reactions and shows each one's date", () => {
    renderList();

    expect(screen.getByRole("heading", { name: /Reactions/ })).toHaveTextContent("Reactions3");
    expect(screen.getAllByRole("listitem").map(item => item.textContent)).toEqual([
      `Opening${new Date(2024, 0, 1).toLocaleDateString()}`,
      `Finale${new Date(2025, 0, 1).toLocaleDateString()}`,
      `Opening 2${new Date(2025, 0, 1).toLocaleDateString()}`,
    ]);
  });

  it("opens the post at the reaction", () => {
    renderList();

    fireEvent.click(screen.getAllByRole("button", { name: "restart reaction" })[1]!);

    const url = new URL(open.mock.calls[0]![0] as string);

    expect(url.pathname).toBe("/posts/pFinale");
    expect(url.searchParams.get("reactionId")).toBe("Finale");
  });

  it("finds reactions by their date", () => {
    renderList([reaction("Opening", 2024), reaction("Finale", 2025)]);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search reactions" }), { target: { value: new Date(2025, 0, 1).toLocaleDateString() } });

    expect(screen.getAllByRole("listitem").map(item => item.textContent)).toEqual([`Finale${new Date(2025, 0, 1).toLocaleDateString()}`]);
  });

  it("shows the whole list for a blank search", () => {
    renderList();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search reactions" }), { target: { value: "   " } });

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.queryByText(/No reactions match/)).not.toBeInTheDocument();
  });
});
