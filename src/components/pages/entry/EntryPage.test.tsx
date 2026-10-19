import type { TEntry } from "../../../core/schemas/entry/entry.schema";

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { EEntryType } from "../../../core/enums/entry-type.enum";
import { request } from "../../../core/messaging/client";
import EntryPage from "./EntryPage";



vi.mock("../../../core/messaging/client", () => ({ request: vi.fn() }));

const movie = { id: "page-entry", type: EEntryType.MOVIE, title: "Dune", altTitles: [] } as TEntry;

/**
 * @description
 * Shows where the router is, to assert navigation.
 *
 * @returns The current path
 */
function Location(): JSX.Element {
  return <p data-testid="location">{useLocation().pathname}</p>;
}

/**
 * @description
 * Renders the page at a path.
 *
 * @param path - Where the router starts
 */
function renderAt(path: string): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/entry" element={<EntryPage />} />
        <Route path="/entry/:entryId" element={<EntryPage />} />
        <Route path="*" element={<Location />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("entryPage", () => {
  beforeEach(() => {
    vi.mocked(request).mockReset();
    vi.mocked(request).mockResolvedValue({ posts: [], entries: [movie] } as never);
  });

  it("shows the entry named by the route", async () => {
    renderAt("/entry/page-entry");

    expect(await screen.findByRole("heading", { name: "Dune" })).toBeInTheDocument();
  });

  it("goes back to the entries list", async () => {
    renderAt("/entry/page-entry");
    fireEvent.click(await screen.findByRole("button", { name: "Back to entries" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/entries");
  });

  it("shows an error for a route without an entry", async () => {
    renderAt("/entry");

    expect(await screen.findByText("Could not retrieve entry")).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
  });
});
