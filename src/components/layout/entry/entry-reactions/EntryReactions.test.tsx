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
