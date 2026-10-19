import type { TEntry } from "../../../core/schemas/entry/entry.schema";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { EEntryType } from "../../../core/enums/entry-type.enum";
import { request } from "../../../core/messaging/client";
import { useEntriesStore } from "../../../state/entries.state";
import EntriesPage from "./EntriesPage";



vi.mock("../../../core/messaging/client", () => ({ request: vi.fn() }));

const frieren = { id: "e1", type: EEntryType.ANIME, title: "Frieren", altTitles: ["Sousou no Frieren", "Frieren: Beyond Journey's End"], malId: 1 } as TEntry;
const kurzgesagt = { id: "e2", type: EEntryType.YOUTUBE, title: "Kurzgesagt", altTitles: ["In a Nutshell"], handle: "kurzgesagt" } as TEntry;
const severance = { id: "e3", type: EEntryType.TV_SHOW, title: "Severance", altTitles: [], cover: "https://example.com/severance.png" } as TEntry;

/**
 * @description
 * An image that loads as soon as it is given a source, as jsdom loads none.
 */
class LoadingImage {
  onload: (() => void) | null = null;
  complete = false;
  naturalWidth = 0;

  get src(): string {
    return "";
  }

  set src(_url: string) {
    queueMicrotask(() => this.onload?.());
  }
}

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
 * Answers the background requests the page makes.
 *
 * @param entries - The entries to list, or a promise or error standing in for them
 * @param covers - The thumbnails of the entries without a cover
 */
function answer(entries: Promise<Array<TEntry>> | Array<TEntry>, covers: Record<string, string> = {}): void {
  vi.mocked(request).mockImplementation((async (type: string) => type === "entries.list" ? entries : covers) as never);
}

/**
 * @description
 * Renders the page in a router.
 *
 * @returns The render result
 */
function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/entries"]}>
      <Routes>
        <Route path="/entries" element={<EntriesPage />} />
        <Route path="*" element={<Location />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("entriesPage", () => {
  beforeEach(() => {
    vi.mocked(request).mockReset();
    useEntriesStore.setState({ entries: [], error: false, loading: false });
    vi.stubGlobal("Image", LoadingImage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a skeleton while the entries load", async () => {
    answer(new Promise(() => undefined));

    renderPage();

    expect(await screen.findByLabelText("Loading entries")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByLabelText("Loading entries").children).toHaveLength(7);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("lists the entries with their type and subtitle", async () => {
    answer([frieren, kurzgesagt]);

    renderPage();

    expect(await screen.findByText("Frieren")).toBeInTheDocument();
    expect(screen.getByText("Sousou no Frieren, Frieren: Beyond Journey's End")).toBeInTheDocument();
    expect(screen.getByText("@kurzgesagt")).toBeInTheDocument();
    expect(screen.getByText("Anime")).toBeInTheDocument();
    expect(screen.getByText("YouTube")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /Frieren/ }).querySelectorAll("span.truncate")).toHaveLength(2);
  });

  it("shows no subtitle for an entry without alternative titles", async () => {
    answer([severance]);

    renderPage();

    const row = await screen.findByRole("button", { name: /Severance/ });

    expect(row.textContent).toBe("SeveranceTV Show");
    expect(row.querySelectorAll("span.truncate")).toHaveLength(1);
  });

  it("shows the thumbnail found for an entry without a cover", async () => {
    answer([frieren], { e1: "https://example.com/frieren.png" });

    renderPage();

    const button = await screen.findByRole("button", { name: /Frieren/ });

    await waitFor(() => expect(button.querySelector("img")).toHaveAttribute("src", "https://example.com/frieren.png"));
  });

  it("prefers an entry's own cover to the thumbnail found for it", async () => {
    answer([severance], { e3: "https://example.com/other.png" });

    renderPage();

    const button = await screen.findByRole("button", { name: /Severance/ });

    await waitFor(() => expect(request).toHaveBeenCalledWith("entries.covers", {}));
    expect(button.querySelector("img")).toHaveAttribute("src", "https://example.com/severance.png");
  });

  it("filters the entries by the search", async () => {
    answer([frieren, kurzgesagt]);

    renderPage();
    await screen.findByText("Frieren");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "NUTSHELL" } });

    expect(screen.queryByText("Frieren")).not.toBeInTheDocument();
    expect(screen.getByText("Kurzgesagt")).toBeInTheDocument();
  });

  it("says nothing matches the search, with the count of all entries", async () => {
    answer([frieren]);

    renderPage();
    await screen.findByText("Frieren");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzz" } });

    expect(screen.getByText(/No entries match/)).toHaveTextContent("No entries match zzz");
    expect(screen.getByText("zzz").tagName).toBe("B");
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("says there are no entries when none exist", async () => {
    answer([]);

    renderPage();

    expect(await screen.findByText("No entries found")).toBeInTheDocument();
  });

  it("shows an error when the entries cannot be loaded", async () => {
    answer(Promise.reject(new Error("Offline")));

    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load data");
    expect(screen.queryByText("No entries found")).not.toBeInTheDocument();
  });

  it("opens an entry's page when it is clicked", async () => {
    answer([frieren, kurzgesagt]);

    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Kurzgesagt/ }));

    expect(screen.getByTestId("location")).toHaveTextContent("/entry/e2");
  });
});
