import type { useEntry } from "../../../hooks/entry.hook";

import { render, screen } from "@testing-library/react";
import EntryView from "./EntryView";



const entryState: ReturnType<typeof useEntry> = {
  loading: true,
  entry: null,
  photo: "",
  description: "",
  subscribers: 0,
  genres: [],
  altTitles: [],
  reactions: [],
};

vi.mock("../../../hooks/entry.hook", () => ({
  useEntry: () => entryState,
}));

describe("entryView", () => {
  it("shows a skeleton, not an error, while the entry loads", () => {
    entryState.loading = true;

    render(<EntryView entryId="e1" />);

    expect(screen.queryByText("Could not retrieve entry")).not.toBeInTheDocument();
  });

  it("shows an error when the entry cannot be found", () => {
    entryState.loading = false;

    render(<EntryView entryId="missing" />);

    expect(screen.getByText("Could not retrieve entry")).toBeInTheDocument();
  });
});
