import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createEntry } from "../../../core/domain/hydrate";
import { EEntryType } from "../../../core/enums/entry-type.enum";
import { request } from "../../../core/messaging/client";
import { useEntriesStore } from "../../../state/entries.state";
import EntryEditorDialog, { toEntryInput, toForm } from "./EntryEditorDialog";



vi.mock("../../../core/messaging/client", () => ({ request: vi.fn() }));

const requestMock = vi.mocked(request);

const frieren = createEntry({ id: "e1", type: EEntryType.ANIME, title: "Frieren", altTitles: ["Sousou no Frieren", "Beyond Journey End"], imdbId: "tt22248376", cover: "https://image.tmdb.org/t/p/w500/a.jpg", malId: 52991, anilistId: 154587, kitsuId: "46474" } as never);
const channel = createEntry({ id: "e2", type: EEntryType.YOUTUBE, title: "KOL", altTitles: [], handle: "kol", channelId: "UC123" } as never);
const matrix = createEntry({ id: "e3", type: EEntryType.MOVIE, title: "The Matrix", altTitles: [], rottentomatoesId: "the_matrix" } as never);

/**
 * @description
 * Picks an entry type in the type picker.
 *
 * @param name - The name of the type to pick
 * @returns Resolves once the type is picked
 */
async function pickType(name: string): Promise<void> {
  fireEvent.click(screen.getByRole("combobox", { name: "Type" }));

  const option = await screen.findByRole("option", { name });

  fireEvent.pointerDown(option);
  fireEvent.mouseDown(option);
  fireEvent.pointerUp(option);
  fireEvent.mouseUp(option);
  fireEvent.click(option);
  await waitFor(() => expect(screen.getByRole("combobox", { name: "Type" })).toHaveTextContent(name));
}

describe("entryEditorDialog", () => {
  beforeEach(() => {
    requestMock.mockReset();
    requestMock.mockImplementation((async (method: string) => method === "entries.list" ? [] : null) as never);
    useEntriesStore.setState({ entries: [], loading: false, error: false });
  });

  it("starts a new entry as an anime with the title it is given", () => {
    render(<EntryEditorDialog open entry={null} initialTitle="Frieren" onClose={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "New entry" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Type" })).toHaveTextContent("Anime");
    expect(screen.getByRole("textbox", { name: /Title/ })).toHaveValue("Frieren");
    expect(screen.getByRole("textbox", { name: "MyAnimeList ID" })).toBeEnabled();
  });

  it("starts a new entry with an empty title by default, and cannot save it", () => {
    render(<EntryEditorDialog open entry={null} onClose={vi.fn()} />);

    expect(screen.getByRole("textbox", { name: /Title/ })).toHaveValue("");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("cannot save a title that is only blank", () => {
    render(<EntryEditorDialog open entry={null} initialTitle="   " onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("gives an example for each ID", async () => {
    render(<EntryEditorDialog open entry={frieren} onClose={vi.fn()} />);

    expect(screen.getByRole("textbox", { name: "IMDb ID" })).toHaveAttribute("placeholder", "e.g. tt0388629");
    expect(screen.getByRole("textbox", { name: "MyAnimeList ID" })).toHaveAttribute("placeholder", "e.g. 21");
    expect(screen.getByRole("textbox", { name: "AniList ID" })).toHaveAttribute("placeholder", "e.g. 21");
    expect(screen.getByRole("textbox", { name: "Kitsu ID" })).toHaveAttribute("placeholder", "e.g. 12");

    await pickType("YouTube channel");

    expect(screen.getByRole("textbox", { name: "Channel handle" })).toHaveAttribute("placeholder", "Without the @");
    expect(screen.getByRole("textbox", { name: "Channel ID" })).toHaveAttribute("placeholder", "e.g. UC...");

    await pickType("Movie");

    expect(screen.getByRole("textbox", { name: "Rotten Tomatoes ID" })).toHaveAttribute("placeholder", "e.g. the_matrix");
  });

  it("fills the form from the entry being edited", () => {
    render(<EntryEditorDialog open entry={frieren} onClose={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Edit entry" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /Title/ })).toHaveValue("Frieren");
    expect(screen.getByRole("textbox", { name: "Other titles" })).toHaveValue("Sousou no Frieren\nBeyond Journey End");
    expect(screen.getByRole("textbox", { name: "Cover link" })).toHaveValue("https://image.tmdb.org/t/p/w500/a.jpg");
    expect(screen.getByRole("textbox", { name: "IMDb ID" })).toHaveValue("tt22248376");
    expect(screen.getByRole("textbox", { name: "MyAnimeList ID" })).toHaveValue("52991");
    expect(screen.getByRole("textbox", { name: "AniList ID" })).toHaveValue("154587");
    expect(screen.getByRole("textbox", { name: "Kitsu ID" })).toHaveValue("46474");
  });

  it("starts over from the entry each time it opens", () => {
    const { rerender } = render(<EntryEditorDialog open entry={frieren} onClose={vi.fn()} />);

    fireEvent.change(screen.getByRole("textbox", { name: /Title/ }), { target: { value: "Changed" } });
    rerender(<EntryEditorDialog open={false} entry={frieren} onClose={vi.fn()} />);
    rerender(<EntryEditorDialog open entry={frieren} onClose={vi.fn()} />);

    expect(screen.getByRole("textbox", { name: /Title/ })).toHaveValue("Frieren");
  });

  it("clears an earlier problem when it opens again", async () => {
    const { rerender } = render(<EntryEditorDialog open entry={frieren} onClose={vi.fn()} />);

    fireEvent.change(screen.getByRole("textbox", { name: "MyAnimeList ID" }), { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByRole("alert");
    rerender(<EntryEditorDialog open={false} entry={frieren} onClose={vi.fn()} />);
    rerender(<EntryEditorDialog open entry={frieren} onClose={vi.fn()} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("leaves the form alone while closed", () => {
    const { rerender } = render(<EntryEditorDialog open={false} entry={null} initialTitle="Frieren" onClose={vi.fn()} />);

    rerender(<EntryEditorDialog open={false} entry={null} initialTitle="Other" onClose={vi.fn()} />);
    rerender(<EntryEditorDialog open entry={null} initialTitle="Other" onClose={vi.fn()} />);

    expect(screen.getByRole("textbox", { name: /Title/ })).toHaveValue("Other");
  });

  it("saves an edited entry under its own ID, reloads the entries and closes", async () => {
    const onClose = vi.fn();

    render(<EntryEditorDialog open entry={frieren} onClose={onClose} />);
    fireEvent.change(screen.getByRole("textbox", { name: /Title/ }), { target: { value: "Frieren S2" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onClose).toHaveBeenCalledExactlyOnceWith("e1"));
    expect(requestMock).toHaveBeenNthCalledWith(1, "entries.save", {
      entry: { id: "e1", type: EEntryType.ANIME, title: "Frieren S2", altTitles: ["Sousou no Frieren", "Beyond Journey End"], imdbId: "tt22248376", cover: "https://image.tmdb.org/t/p/w500/a.jpg", malId: 52991, anilistId: 154587, kitsuId: "46474" },
    });
    expect(requestMock).toHaveBeenNthCalledWith(2, "entries.list", { force: true });
  });

  it("gives a new entry a fresh ID", async () => {
    const onClose = vi.fn();

    vi.spyOn(crypto, "randomUUID").mockReturnValueOnce("00000000-0000-4000-8000-000000000001");
    render(<EntryEditorDialog open entry={null} initialTitle="Frieren" onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onClose).toHaveBeenCalledExactlyOnceWith("00000000-0000-4000-8000-000000000001"));
    expect(requestMock).toHaveBeenCalledWith("entries.save", { entry: expect.objectContaining({ id: "00000000-0000-4000-8000-000000000001", title: "Frieren" }) });
  });

  it("disables the form while saving", async () => {
    let finish: () => void = () => undefined;

    requestMock.mockImplementation(((method: string) => method === "entries.save"
      ? new Promise<null>((resolve) => {
          finish = () => resolve(null);
        })
      : Promise.resolve([])) as never);
    render(<EntryEditorDialog open entry={frieren} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Save" })).toBeDisabled());
    expect(screen.getByRole("textbox", { name: /Title/ })).toBeDisabled();

    finish();

    await waitFor(() => expect(screen.getByRole("button", { name: "Save" })).toBeEnabled());
  });

  it("shows why saving failed, under the form, and stays open", async () => {
    const onClose = vi.fn();

    requestMock.mockRejectedValueOnce(new Error("Offline"));
    render(<EntryEditorDialog open entry={frieren} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Offline");
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("clears a failure when saving again", async () => {
    requestMock.mockRejectedValueOnce(new Error("Offline"));
    render(<EntryEditorDialog open entry={frieren} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Offline");

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(screen.queryByText("Offline")).not.toBeInTheDocument());
  });

  it("closes without an entry when cancelled", () => {
    const onClose = vi.fn();

    render(<EntryEditorDialog open entry={frieren} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledExactlyOnceWith();
    expect(requestMock).not.toHaveBeenCalled();
  });

  it("closes without an entry when dismissed", async () => {
    const onClose = vi.fn();

    render(<EntryEditorDialog open entry={frieren} onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    await waitFor(() => expect(onClose).toHaveBeenCalledWith());
  });

  it("shows a problem with the title under it", async () => {
    render(<EntryEditorDialog open entry={null} initialTitle="x" onClose={vi.fn()} />);

    fireEvent.change(screen.getByRole("textbox", { name: /Title/ }), { target: { value: "x".repeat(301) } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect((await screen.findByRole("alert")).closest("[data-slot=field]")).toHaveTextContent("Title");
    expect(screen.getByRole("textbox", { name: /Title/ })).toHaveAttribute("aria-invalid", "true");
  });

  it("shows a problem with the other titles under them", async () => {
    render(<EntryEditorDialog open entry={null} initialTitle="Frieren" onClose={vi.fn()} />);

    fireEvent.change(screen.getByRole("textbox", { name: "Other titles" }), { target: { value: "x".repeat(301) } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect((await screen.findByRole("alert")).closest("[data-slot=field]")).toHaveTextContent("Other titles");
    expect(screen.getByRole("textbox", { name: "Other titles" })).toHaveAttribute("aria-invalid", "true");
  });

  it("shows a problem with the cover under it", async () => {
    render(<EntryEditorDialog open entry={null} initialTitle="Frieren" onClose={vi.fn()} />);

    fireEvent.change(screen.getByRole("textbox", { name: "Cover link" }), { target: { value: "http://evil.example/a.jpg" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect((await screen.findByRole("alert")).closest("[data-slot=field]")).toHaveTextContent("Cover link");
    expect(screen.getByRole("textbox", { name: "Cover link" })).toHaveAttribute("aria-invalid", "true");
  });

  it("hints how to fill the cover, by type", async () => {
    render(<EntryEditorDialog open entry={null} initialTitle="Frieren" onClose={vi.fn()} />);

    expect(screen.getByText("Optional: MyAnimeList and YouTube provide one")).toBeInTheDocument();

    await pickType("YouTube channel");
    expect(screen.getByText("Optional: MyAnimeList and YouTube provide one")).toBeInTheDocument();

    await pickType("Movie");
    expect(screen.getByText("An https link, e.g. from TMDB or IMDb")).toBeInTheDocument();
    expect(screen.queryByText("Optional: MyAnimeList and YouTube provide one")).not.toBeInTheDocument();
  });

  it("hides the hint of a field that has a problem", async () => {
    render(<EntryEditorDialog open entry={null} initialTitle="Frieren" onClose={vi.fn()} />);

    fireEvent.change(screen.getByRole("textbox", { name: "Cover link" }), { target: { value: "http://evil.example/a.jpg" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByRole("alert");

    expect(screen.queryByText("Optional: MyAnimeList and YouTube provide one")).not.toBeInTheDocument();
  });

  it("marks only the title as required", () => {
    render(<EntryEditorDialog open entry={null} onClose={vi.fn()} />);

    expect(screen.getByRole("textbox", { name: /Title/ })).toBeRequired();
    expect(screen.getByRole("textbox", { name: "Other titles" })).not.toBeRequired();
    expect((screen.getByRole("textbox", { name: /Title/ }) as HTMLInputElement).labels?.[0]?.textContent).toBe("Title*");
    expect((screen.getByRole("textbox", { name: "Other titles" }) as HTMLTextAreaElement).labels?.[0]?.textContent).toBe("Other titles");
  });

  it("shows a spinner in the save button only while saving", async () => {
    let finish: () => void = () => undefined;

    requestMock.mockImplementation(((method: string) => method === "entries.save"
      ? new Promise<null>((resolve) => {
          finish = () => resolve(null);
        })
      : Promise.resolve([])) as never);
    render(<EntryEditorDialog open entry={frieren} onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Save" }).querySelector("[data-icon=inline-start]")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Save" }).querySelector("[data-icon=inline-start]")).not.toBeNull());

    finish();

    await waitFor(() => expect(screen.getByRole("button", { name: "Save" }).querySelector("[data-icon=inline-start]")).toBeNull());
  });

  it.each(["TV Show", "Cartoon"])("offers no ID field of its own for %s", async (name) => {
    render(<EntryEditorDialog open entry={null} initialTitle="Bluey" onClose={vi.fn()} />);

    await pickType(name);

    expect(screen.getAllByRole("textbox").map(box => (box as HTMLInputElement).labels?.[0]?.textContent)).toEqual(
      ["Title*", "Other titles", "Cover link", "IMDb ID", "MyAnimeList ID", "AniList ID", "Kitsu ID"],
    );
  });

  it("keeps the anime IDs visible but disabled for other types, and loses nothing", async () => {
    render(<EntryEditorDialog open entry={frieren} onClose={vi.fn()} />);

    await pickType("TV Show");

    expect(screen.getByRole("textbox", { name: "MyAnimeList ID" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "AniList ID" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Kitsu ID" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "IMDb ID" })).toBeEnabled();

    await pickType("Anime");

    expect(screen.getByRole("textbox", { name: "MyAnimeList ID" })).toBeEnabled();
    expect(screen.getByRole("textbox", { name: "MyAnimeList ID" })).toHaveValue("52991");
  });

  it("offers the channel fields for a YouTube channel", () => {
    render(<EntryEditorDialog open entry={channel} onClose={vi.fn()} />);

    expect(screen.getByRole("combobox", { name: "Type" })).toHaveTextContent("YouTube channel");
    expect(screen.getByRole("textbox", { name: "Channel handle" })).toHaveValue("kol");
    expect(screen.getByRole("textbox", { name: "Channel ID" })).toHaveValue("UC123");
    expect(screen.queryByRole("textbox", { name: "Rotten Tomatoes ID" })).not.toBeInTheDocument();
  });

  it("offers the Rotten Tomatoes ID for a movie", () => {
    render(<EntryEditorDialog open entry={matrix} onClose={vi.fn()} />);

    expect(screen.getByRole("textbox", { name: "Rotten Tomatoes ID" })).toHaveValue("the_matrix");
    expect(screen.queryByRole("textbox", { name: "Channel handle" })).not.toBeInTheDocument();
  });

  it("offers no extra field for cartoons", async () => {
    render(<EntryEditorDialog open entry={null} initialTitle="Bluey" onClose={vi.fn()} />);

    await pickType("Cartoon");

    expect(screen.getByRole("combobox", { name: "Type" })).toHaveTextContent("Cartoon");
    expect(screen.queryByRole("textbox", { name: "Channel handle" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Rotten Tomatoes ID" })).not.toBeInTheDocument();
  });

  it("saves only the fields of the type picked", async () => {
    render(<EntryEditorDialog open entry={frieren} onClose={vi.fn()} />);

    await pickType("YouTube channel");
    fireEvent.change(screen.getByRole("textbox", { name: "Channel handle" }), { target: { value: "kol" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("entries.save", {
      entry: { id: "e1", type: EEntryType.YOUTUBE, title: "Frieren", altTitles: ["Sousou no Frieren", "Beyond Journey End"], imdbId: "tt22248376", cover: "https://image.tmdb.org/t/p/w500/a.jpg", handle: "kol" },
    }));
  });

  it("types into the ID fields", async () => {
    render(<EntryEditorDialog open entry={null} initialTitle="Frieren" onClose={vi.fn()} />);

    fireEvent.change(screen.getByRole("textbox", { name: "IMDb ID" }), { target: { value: "tt1" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Kitsu ID" }), { target: { value: "12" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("entries.save", { entry: expect.objectContaining({ imdbId: "tt1", kitsuId: "12" }) }));
  });
});

describe("toForm", () => {
  it("starts a new entry as an anime with the given title", () => {
    expect(toForm(null, "Frieren")).toEqual({ type: EEntryType.ANIME, title: "Frieren", altTitles: "", imdbId: "", cover: "", malId: "", anilistId: "", kitsuId: "", handle: "", channelId: "", rottentomatoesId: "" });
  });

  it("fills every field from an entry, one other title per line", () => {
    expect(toForm(frieren, "ignored")).toEqual({ type: EEntryType.ANIME, title: "Frieren", altTitles: "Sousou no Frieren\nBeyond Journey End", imdbId: "tt22248376", cover: "https://image.tmdb.org/t/p/w500/a.jpg", malId: "52991", anilistId: "154587", kitsuId: "46474", handle: "", channelId: "", rottentomatoesId: "" });
    expect(toForm(channel, "")).toMatchObject({ type: EEntryType.YOUTUBE, handle: "kol", channelId: "UC123" });
    expect(toForm(matrix, "")).toMatchObject({ type: EEntryType.MOVIE, rottentomatoesId: "the_matrix" });
  });

  it("leaves a field empty when the entry has a null for it", () => {
    const nulled = { ...frieren, id: "e1", type: EEntryType.ANIME, title: "Frieren", altTitles: [], model: { imdbId: null, cover: null, malId: 0 } } as never;

    expect(toForm(nulled, "")).toMatchObject({ imdbId: "", cover: "", malId: "0", anilistId: "" });
  });
});

describe("toEntryInput", () => {
  const form = toForm(null, "Frieren");

  it("reads the anime IDs as numbers, and the Kitsu ID as text", () => {
    expect(toEntryInput("e1", { ...form, malId: " 52991 ", anilistId: "154587", kitsuId: " 46474 " })).toEqual({
      entry: { id: "e1", type: EEntryType.ANIME, title: "Frieren", altTitles: [], malId: 52991, anilistId: 154587, kitsuId: "46474" },
    });
  });

  it("leaves out an anime ID that is blank", () => {
    expect(toEntryInput("e1", { ...form, malId: "   ", anilistId: "" })).toEqual({
      entry: { id: "e1", type: EEntryType.ANIME, title: "Frieren", altTitles: [] },
    });
  });

  it("trims the other titles and drops the blank ones", () => {
    expect(toEntryInput("e1", { ...form, altTitles: "  Sousou no Frieren  \n   \n\nBeyond Journey End " })).toEqual({
      entry: expect.objectContaining({ altTitles: ["Sousou no Frieren", "Beyond Journey End"] }),
    });
  });

  it("keeps the channel fields for a YouTube channel only", () => {
    expect(toEntryInput("e2", { ...form, type: EEntryType.YOUTUBE, malId: "1", handle: "kol", channelId: "UC123" })).toEqual({
      entry: { id: "e2", type: EEntryType.YOUTUBE, title: "Frieren", altTitles: [], handle: "kol", channelId: "UC123" },
    });
  });

  it("keeps the Rotten Tomatoes ID for a movie only", () => {
    expect(toEntryInput("e3", { ...form, type: EEntryType.MOVIE, rottentomatoesId: "the_matrix", handle: "stale" })).toEqual({
      entry: { id: "e3", type: EEntryType.MOVIE, title: "Frieren", altTitles: [], rottentomatoesId: "the_matrix" },
    });
  });

  it("names the field at fault", () => {
    expect(toEntryInput("e1", { ...form, anilistId: "-3" })).toMatchObject({ field: "anilistId" });
    expect(toEntryInput("e1", { ...form, title: "" })).toMatchObject({ field: "title" });
    expect(toEntryInput("e1", { ...form, cover: "http://x.example/a.jpg" })).toMatchObject({ field: "cover" });
  });

  it("names no field when the problem is not with one of the form fields", () => {
    expect(toEntryInput("", form)).toEqual({ error: expect.any(String), field: undefined });
  });
});
