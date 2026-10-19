import type { TEntry } from "../../../core/schemas/entry/entry.schema";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createEntry } from "../../../core/domain/hydrate";
import { Tag } from "../../../core/domain/tag";
import { EEntryType } from "../../../core/enums/entry-type.enum";
import { request } from "../../../core/messaging/client";
import { useEntriesStore } from "../../../state/entries.state";
import ReactionEditorDialog, { toYouTubeVideoId } from "./ReactionEditorDialog";



vi.mock("../../../core/messaging/client", () => ({ request: vi.fn() }));
vi.mock("../../../content/player/PlayerProvider", () => ({ usePlayer: () => ({ ready: true, currentTime: 754.6 }) }));

const requestMock = vi.mocked(request);

const frierenModel = { id: "e1", type: EEntryType.ANIME, title: "Frieren", altTitles: ["Sousou no Frieren"] } as TEntry;
const matrixModel = { id: "e2", type: EEntryType.MOVIE, title: "The Matrix", altTitles: [] } as unknown as TEntry;
const kolModel = { id: "e3", type: EEntryType.YOUTUBE, title: "KOL", altTitles: ["Shared name"] } as unknown as TEntry;
const otherChannelModel = { id: "e4", type: EEntryType.YOUTUBE, title: "Other Channel", altTitles: [] } as unknown as TEntry;
const frieren = createEntry(frierenModel);
const kol = createEntry(kolModel);

const animeTag = new Tag({ id: "t1", entryId: "e1", label: "4", description: "Hover", startTime: 60, endTime: 120, context: {} }, frieren);
const videoTag = new Tag({ id: "t2", entryId: "e3", label: "Funniest moments", description: "", startTime: 5, endTime: 50, context: { title: "Funny video", videoId: "abc123", altTitles: ["Funny", "Funny video 2"] } }, kol);

let models: Array<TEntry> = [];

/**
 * @description
 * Renders an open reaction editor, with the entries already loaded.
 *
 * @param props - What to override
 * @param props.tag - The reaction to edit
 * @param props.initial - Times to start with
 * @param props.initial.startTime - The start time to start with
 * @param props.initial.endTime - The end time to start with
 * @param props.onClose - Called when the dialog closes
 * @returns The rerender function
 */
function renderDialog(props: { tag?: Tag | null; initial?: { startTime?: number; endTime?: number }; onClose?: (saved: boolean) => void } = {}) {
  const onClose = props.onClose ?? vi.fn();
  const element = (open: boolean) => <ReactionEditorDialog open={open} postId="post-1001" tag={props.tag ?? null} initial={props.initial} onClose={onClose} />;
  const view = render(element(true));

  return (open: boolean) => view.rerender(element(open));
}

/**
 * @description
 * Picks an entry from the list by typing its name.
 *
 * @param query - What to type
 * @param name - The name of the entry to pick
 * @returns Resolves once the entry is picked
 */
async function pickEntry(query: string, name: RegExp): Promise<void> {
  const picker = screen.getByRole("combobox", { name: /What KOL reacted to/ });

  fireEvent.input(picker, { target: { value: query }, inputType: "insertText" });

  await screen.findByRole("option", { name });
  fireEvent.keyDown(picker, { key: "ArrowDown" });
  fireEvent.keyDown(picker, { key: "Enter" });
  await waitFor(() => expect((picker as HTMLInputElement).value).toContain(" · "));
}

/**
 * @description
 * Gets the requests made to a method.
 *
 * @param method - The method
 * @returns The payloads
 */
function callsTo(method: string): Array<unknown> {
  return requestMock.mock.calls.filter(([name]) => name === method).map(([, payload]) => payload);
}

const save = () => fireEvent.click(screen.getByRole("button", { name: "Save" }));
const time = (name: string) => screen.getByRole("textbox", { name });

describe("toYouTubeVideoId", () => {
  it("reads the id from a watch link, whatever else it has", () => {
    expect(toYouTubeVideoId("https://www.youtube.com/watch?v=abc123&t=5")).toBe("abc123");
    expect(toYouTubeVideoId("https://www.youtube.com/watch?t=5&v=abc123")).toBe("abc123");
  });

  it("reads the id from a short link", () => {
    expect(toYouTubeVideoId("https://youtu.be/abc123?t=5")).toBe("abc123");
  });

  it("reads the id from shorts, embed and live links", () => {
    expect(toYouTubeVideoId("https://www.youtube.com/shorts/abc-123")).toBe("abc-123");
    expect(toYouTubeVideoId("https://www.youtube.com/embed/abc_123")).toBe("abc_123");
    expect(toYouTubeVideoId("https://www.youtube.com/live/abc123?feature=share")).toBe("abc123");
  });

  it("keeps a link it cannot read as it is", () => {
    expect(toYouTubeVideoId("https://www.youtube.com/@kol")).toBe("https://www.youtube.com/@kol");
  });

  it("takes anything that is not a link as the id, trimmed", () => {
    expect(toYouTubeVideoId(" abc123 ")).toBe("abc123");
    expect(toYouTubeVideoId("")).toBe("");
  });
});

describe("reactionEditorDialog", () => {
  beforeEach(() => {
    models = [frierenModel, matrixModel, kolModel, otherChannelModel];
    requestMock.mockReset();
    requestMock.mockImplementation((async (method: string) => method === "entries.list" ? models : null) as never);
    useEntriesStore.setState({ entries: models.map(createEntry), loading: false, error: false });
  });

  describe("adding a reaction", () => {
    it("starts empty, and loads the entries", async () => {
      renderDialog();

      expect(screen.getByRole("heading", { name: "Add a reaction" })).toBeInTheDocument();
      expect(screen.getByRole("combobox", { name: /What KOL reacted to/ })).toHaveValue("");
      expect(screen.getByRole("textbox", { name: "Label" })).toHaveValue("");
      expect(screen.getByRole("textbox", { name: "Hover text" })).toHaveValue("");
      expect(time("Starts at")).toHaveValue("");
      expect(time("Ends at")).toHaveValue("");
      expect(screen.queryByRole("textbox", { name: /Other titles/ })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "edit entry" })).not.toBeInTheDocument();
      await waitFor(() => expect(requestMock).toHaveBeenCalledWith("entries.list", { force: false }));
    });

    it("starts with the times it is given", () => {
      renderDialog({ initial: { startTime: 30, endTime: 90 } });

      expect(time("Starts at")).toHaveValue("0:00:30");
      expect(time("Ends at")).toHaveValue("0:01:30");
    });

    it("loads nothing while closed", () => {
      renderDialog();
      requestMock.mockClear();
      render(<ReactionEditorDialog open={false} postId="post-1001" tag={null} onClose={vi.fn()} />);

      expect(requestMock).not.toHaveBeenCalled();
    });

    it("lists only the entries that match what was typed", async () => {
      renderDialog();

      fireEvent.input(screen.getByRole("combobox", { name: /What KOL reacted to/ }), { target: { value: "FRIE" }, inputType: "insertText" });

      expect(await screen.findByRole("option", { name: /Frieren/ })).toBeInTheDocument();
      expect(screen.queryByRole("option", { name: /The Matrix/ })).not.toBeInTheDocument();
    });

    it("matches an entry by its other titles", async () => {
      renderDialog();

      fireEvent.input(screen.getByRole("combobox", { name: /What KOL reacted to/ }), { target: { value: "sousou" }, inputType: "insertText" });

      expect(await screen.findByRole("option", { name: /Frieren/ })).toBeInTheDocument();
    });

    it("says when no entry matches", async () => {
      renderDialog();

      fireEvent.input(screen.getByRole("combobox", { name: /What KOL reacted to/ }), { target: { value: "zzz" }, inputType: "insertText" });

      expect(await screen.findByText("No entry matches. Create one with +")).toBeInTheDocument();
    });

    it("names each entry's type in the list", async () => {
      renderDialog();

      fireEvent.input(screen.getByRole("combobox", { name: /What KOL reacted to/ }), { target: { value: "matrix" }, inputType: "insertText" });

      expect(await screen.findByRole("option", { name: /The Matrix\s*Movie/ })).toBeInTheDocument();
    });

    it("asks for an episode of a show, and suggests the hover text from it", async () => {
      renderDialog();

      await pickEntry("frie", /Frieren/);

      expect(screen.getByRole("textbox", { name: "Episode" })).toHaveAttribute("placeholder", "e.g. 12");
      expect(screen.getByRole("textbox", { name: "Hover text" })).toHaveValue("Frieren");

      fireEvent.change(screen.getByRole("textbox", { name: "Episode" }), { target: { value: " 7 " } });

      expect(screen.getByRole("textbox", { name: "Hover text" })).toHaveValue("Episode 7 of Frieren");
      expect(screen.getByRole("textbox", { name: "Hover text" })).toHaveAttribute("placeholder", "Episode 7 of Frieren");
    });

    it("asks for a label of anything else", async () => {
      renderDialog();

      await pickEntry("matrix", /The Matrix/);
      fireEvent.change(screen.getByRole("textbox", { name: "Label" }), { target: { value: "Opening" } });

      expect(screen.getByRole("textbox", { name: "Label" })).toHaveAttribute("placeholder", "e.g. the video's name");
      expect(screen.getByRole("textbox", { name: "Hover text" })).toHaveValue("The Matrix");
    });

    it("keeps the hover text once it is typed over", async () => {
      renderDialog();

      await pickEntry("frie", /Frieren/);
      fireEvent.change(screen.getByRole("textbox", { name: "Hover text" }), { target: { value: "My text" } });
      fireEvent.change(screen.getByRole("textbox", { name: "Episode" }), { target: { value: "9" } });

      expect(screen.getByRole("textbox", { name: "Hover text" })).toHaveValue("My text");
    });

    it("hints the hover text without an entry", () => {
      renderDialog();

      expect(screen.getByRole("textbox", { name: "Hover text" })).toHaveAttribute("placeholder", "e.g. Episode 7 of FROM");
      expect(screen.getByText("Shown when hovering the reaction's chip")).toBeInTheDocument();
    });

    it("offers the entry's other titles, to save with the entry", async () => {
      renderDialog();

      await pickEntry("frie", /Frieren/);

      expect(screen.getByRole("textbox", { name: "Other titles of Frieren" })).toHaveValue("Sousou no Frieren");
      expect(screen.getByText("One per line. Saved to the entry, for every reaction to it")).toBeInTheDocument();
      expect(screen.queryByRole("textbox", { name: "Video title" })).not.toBeInTheDocument();
    });

    it("saves the reaction without touching an entry that did not change", async () => {
      const onClose = vi.fn();

      vi.spyOn(crypto, "randomUUID").mockReturnValueOnce("00000000-0000-4000-8000-000000000001");
      renderDialog({ onClose });
      await pickEntry("frie", /Frieren/);
      fireEvent.change(screen.getByRole("textbox", { name: "Episode" }), { target: { value: "7" } });
      fireEvent.change(time("Starts at"), { target: { value: "1:00" } });
      fireEvent.change(time("Ends at"), { target: { value: "2:00" } });
      save();

      await waitFor(() => expect(onClose).toHaveBeenCalledExactlyOnceWith(true));
      expect(callsTo("entries.save")).toEqual([]);
      expect(callsTo("tags.save")).toEqual([{
        postId: "post-1001",
        tag: { id: "00000000-0000-4000-8000-000000000001", entryId: "e1", label: "7", description: "Episode 7 of Frieren", startTime: 60, endTime: 120, context: {} },
      }]);
    });

    it("saves the entry's other titles with the reaction, entry first", async () => {
      const onClose = vi.fn();

      renderDialog({ onClose });
      await pickEntry("frie", /Frieren/);
      fireEvent.change(screen.getByRole("textbox", { name: "Episode" }), { target: { value: "7" } });
      fireEvent.change(screen.getByRole("textbox", { name: "Other titles of Frieren" }), { target: { value: "Sousou no Frieren\n\n  Frieren S1  " } });
      fireEvent.change(time("Starts at"), { target: { value: "1:00" } });
      fireEvent.change(time("Ends at"), { target: { value: "2:00" } });
      save();

      await waitFor(() => expect(onClose).toHaveBeenCalledExactlyOnceWith(true));
      expect(callsTo("entries.save")).toEqual([{ entry: { id: "e1", type: EEntryType.ANIME, title: "Frieren", altTitles: ["Sousou no Frieren", "Frieren S1"] } }]);
      expect(requestMock.mock.calls.findIndex(([name]) => name === "entries.save")).toBeLessThan(requestMock.mock.calls.findIndex(([name]) => name === "tags.save"));
    });

    it("shows a problem with the entry's other titles under them, and saves nothing", async () => {
      renderDialog();
      await pickEntry("frie", /Frieren/);
      fireEvent.change(screen.getByRole("textbox", { name: "Episode" }), { target: { value: "7" } });
      fireEvent.change(screen.getByRole("textbox", { name: "Other titles of Frieren" }), { target: { value: "x".repeat(301) } });
      fireEvent.change(time("Starts at"), { target: { value: "1:00" } });
      fireEvent.change(time("Ends at"), { target: { value: "2:00" } });
      save();

      expect((await screen.findByRole("alert")).closest("[data-slot=field]")).toHaveTextContent("Other titles of Frieren");
      expect(screen.getByRole("textbox", { name: "Other titles of Frieren" })).toHaveAttribute("aria-invalid", "true");
      expect(screen.queryByText("One per line. Saved to the entry, for every reaction to it")).not.toBeInTheDocument();
      expect(callsTo("entries.save")).toEqual([]);
      expect(callsTo("tags.save")).toEqual([]);
    });

    it("asks to pick an entry, under its field, without saving", async () => {
      renderDialog();
      fireEvent.change(screen.getByRole("textbox", { name: "Label" }), { target: { value: "7" } });
      save();

      expect(await screen.findByRole("alert")).toHaveTextContent("Pick what KOL reacted to");
      expect(screen.getByRole("alert").closest("[data-slot=field]")).toHaveTextContent("What KOL reacted to");
      expect(screen.getByRole("combobox", { name: /What KOL reacted to/ })).toHaveAttribute("aria-invalid", "true");
      expect(callsTo("tags.save")).toEqual([]);
    });

    it("asks for a label under its field", async () => {
      renderDialog();
      await pickEntry("matrix", /The Matrix/);
      fireEvent.change(time("Starts at"), { target: { value: "1:00" } });
      fireEvent.change(time("Ends at"), { target: { value: "2:00" } });
      save();

      expect((await screen.findByRole("alert")).closest("[data-slot=field]")).toHaveTextContent("Label");
      expect(screen.getByRole("textbox", { name: "Label" })).toHaveAttribute("aria-invalid", "true");
      expect(callsTo("tags.save")).toEqual([]);
    });

    it("asks for the start time under its field", async () => {
      renderDialog();
      await pickEntry("matrix", /The Matrix/);
      fireEvent.change(screen.getByRole("textbox", { name: "Label" }), { target: { value: "Opening" } });
      fireEvent.change(time("Ends at"), { target: { value: "2:00" } });
      save();

      expect((await screen.findByRole("alert")).closest("[data-slot=field]")).toHaveTextContent("Starts at");
      expect(time("Starts at")).toHaveAttribute("aria-invalid", "true");
      expect(callsTo("tags.save")).toEqual([]);
    });

    it("asks for the end time under its field", async () => {
      renderDialog();
      await pickEntry("matrix", /The Matrix/);
      fireEvent.change(screen.getByRole("textbox", { name: "Label" }), { target: { value: "Opening" } });
      fireEvent.change(time("Starts at"), { target: { value: "1:00" } });
      save();

      expect((await screen.findByRole("alert")).closest("[data-slot=field]")).toHaveTextContent("Ends at");
      expect(time("Ends at")).toHaveAttribute("aria-invalid", "true");
      expect(callsTo("tags.save")).toEqual([]);
    });

    it("shows a problem with the hover text under it", async () => {
      renderDialog();
      await pickEntry("matrix", /The Matrix/);
      fireEvent.change(screen.getByRole("textbox", { name: "Label" }), { target: { value: "Opening" } });
      fireEvent.change(screen.getByRole("textbox", { name: "Hover text" }), { target: { value: "x".repeat(1001) } });
      fireEvent.change(time("Starts at"), { target: { value: "1:00" } });
      fireEvent.change(time("Ends at"), { target: { value: "2:00" } });
      save();

      expect((await screen.findByRole("alert")).closest("[data-slot=field]")).toHaveTextContent("Hover text");
      expect(screen.getByRole("textbox", { name: "Hover text" })).toHaveAttribute("aria-invalid", "true");
      expect(screen.queryByText("Shown when hovering the reaction's chip")).not.toBeInTheDocument();
    });

    it("cannot save times that end before they start", async () => {
      renderDialog();
      fireEvent.change(time("Starts at"), { target: { value: "2:00" } });
      fireEvent.change(time("Ends at"), { target: { value: "1:00" } });

      expect(screen.getByRole("alert")).toHaveTextContent("Must be after the start");
      expect(screen.getByRole("alert").closest("[data-slot=field]")).toHaveTextContent("Ends at");
      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

      fireEvent.change(time("Ends at"), { target: { value: "2:01" } });

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
    });

    it("takes the times from the video", () => {
      renderDialog();
      fireEvent.click(screen.getByRole("button", { name: "Set starts at from the video" }));

      expect(time("Starts at")).toHaveValue("0:12:34");
    });
  });

  describe("saving", () => {
    /**
     * @description
     * Fills in the movie reaction that can be saved.
     *
     * @returns Resolves once the form is filled in
     */
    async function fillMovieReaction(): Promise<void> {
      await pickEntry("matrix", /The Matrix/);
      fireEvent.change(screen.getByRole("textbox", { name: "Label" }), { target: { value: "Opening" } });
      fireEvent.change(time("Starts at"), { target: { value: "1:00" } });
      fireEvent.change(time("Ends at"), { target: { value: "2:00" } });
    }

    it("is disabled while saving", async () => {
      let finish: () => void = () => undefined;

      requestMock.mockImplementation(((method: string) => method === "tags.save"
        ? new Promise<null>((resolve) => {
            finish = () => resolve(null);
          })
        : Promise.resolve(models)) as never);
      renderDialog();
      await fillMovieReaction();
      save();

      await waitFor(() => expect(screen.getByRole("button", { name: "Save" })).toBeDisabled());
      expect(screen.getByRole("textbox", { name: "Label" })).toBeDisabled();

      finish();

      await waitFor(() => expect(screen.getByRole("button", { name: "Save" })).toBeEnabled());
    });

    it("shows why saving failed under the form, and stays open", async () => {
      const onClose = vi.fn();

      requestMock.mockImplementation((async (method: string) => {
        if (method === "tags.save") {
          throw new Error("Offline");
        }

        return models;
      }) as never);
      renderDialog({ onClose });
      await fillMovieReaction();
      save();

      expect(await screen.findByRole("alert")).toHaveTextContent("Offline");
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
    });

    it("does not save the reaction when saving its entry failed", async () => {
      requestMock.mockImplementation((async (method: string) => {
        if (method === "entries.save") {
          throw new Error("Missing or insufficient permissions.");
        }

        return models;
      }) as never);
      renderDialog();
      await pickEntry("frie", /Frieren/);
      fireEvent.change(screen.getByRole("textbox", { name: "Episode" }), { target: { value: "7" } });
      fireEvent.change(screen.getByRole("textbox", { name: "Other titles of Frieren" }), { target: { value: "Frieren S1" } });
      fireEvent.change(time("Starts at"), { target: { value: "1:00" } });
      fireEvent.change(time("Ends at"), { target: { value: "2:00" } });
      save();

      expect(await screen.findByRole("alert")).toHaveTextContent("The database refused this change");
      expect(callsTo("tags.save")).toEqual([]);
    });

    it("clears a failure when saving again", async () => {
      requestMock.mockImplementation((async (method: string) => {
        if (method === "tags.save") {
          throw new Error("Offline");
        }

        return models;
      }) as never);
      renderDialog();
      await fillMovieReaction();
      save();
      await screen.findByText("Offline");
      requestMock.mockImplementation((async () => models) as never);
      save();

      await waitFor(() => expect(screen.queryByText("Offline")).not.toBeInTheDocument());
    });

    it("closes as not saved when cancelled", () => {
      const onClose = vi.fn();

      renderDialog({ onClose });
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(onClose).toHaveBeenCalledExactlyOnceWith(false);
    });

    it("closes as not saved when dismissed", async () => {
      const onClose = vi.fn();

      renderDialog({ onClose });
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

      await waitFor(() => expect(onClose).toHaveBeenCalledWith(false));
    });

    it("starts over each time it opens", async () => {
      const rerender = renderDialog({ tag: animeTag });

      fireEvent.change(screen.getByRole("textbox", { name: "Episode" }), { target: { value: "99" } });
      save();
      await waitFor(() => expect(callsTo("tags.save")).toHaveLength(1));
      rerender(false);
      rerender(true);

      expect(screen.getByRole("textbox", { name: "Episode" })).toHaveValue("4");
    });

    it("clears an earlier problem when it opens again", async () => {
      const rerender = renderDialog();

      save();
      await screen.findByRole("alert");
      rerender(false);
      rerender(true);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("editing a reaction", () => {
    it("fills the form from the reaction", async () => {
      renderDialog({ tag: animeTag });

      expect(screen.getByRole("heading", { name: "Edit reaction" })).toBeInTheDocument();
      await waitFor(() => expect(screen.getByRole("combobox", { name: /What KOL reacted to/ })).toHaveValue("Frieren · Anime"));
      expect(screen.getByRole("textbox", { name: "Episode" })).toHaveValue("4");
      expect(screen.getByRole("textbox", { name: "Hover text" })).toHaveValue("Hover");
      expect(time("Starts at")).toHaveValue("0:01:00");
      expect(time("Ends at")).toHaveValue("0:02:00");
      expect(screen.getByRole("textbox", { name: "Other titles of Frieren" })).toHaveValue("Sousou no Frieren");
    });

    it("keeps an empty hover text empty instead of suggesting one", async () => {
      renderDialog({ tag: new Tag({ id: "t1", entryId: "e1", label: "4", description: "", startTime: 60, endTime: 120, context: {} }, frieren) });

      await waitFor(() => expect(screen.getByRole("combobox", { name: /What KOL reacted to/ })).toHaveValue("Frieren · Anime"));
      expect(screen.getByRole("textbox", { name: "Hover text" })).toHaveValue("");
    });

    it("prefers the times it is given over the reaction's", () => {
      renderDialog({ tag: animeTag, initial: { startTime: 70, endTime: 130 } });

      expect(time("Starts at")).toHaveValue("0:01:10");
      expect(time("Ends at")).toHaveValue("0:02:10");
    });

    it("takes one time it is given, and the reaction's other", () => {
      renderDialog({ tag: animeTag, initial: { startTime: 70 } });

      expect(time("Starts at")).toHaveValue("0:01:10");
      expect(time("Ends at")).toHaveValue("0:02:00");
    });

    it("saves the changes under the reaction's own ID", async () => {
      const onClose = vi.fn();

      renderDialog({ tag: animeTag, onClose });
      await waitFor(() => expect(screen.getByRole("combobox", { name: /What KOL reacted to/ })).toHaveValue("Frieren · Anime"));
      fireEvent.change(screen.getByRole("textbox", { name: "Episode" }), { target: { value: "5" } });
      fireEvent.change(time("Ends at"), { target: { value: "2:30" } });
      save();

      await waitFor(() => expect(onClose).toHaveBeenCalledExactlyOnceWith(true));
      expect(callsTo("tags.save")).toEqual([{
        postId: "post-1001",
        tag: { id: "t1", entryId: "e1", label: "5", description: "Hover", startTime: 60, endTime: 150, context: {} },
      }]);
    });

    it("shows a problem a reaction has with no field under the form", async () => {
      renderDialog({ tag: new Tag({ id: "", entryId: "e1", label: "4", description: "", startTime: 60, endTime: 120, context: {} }, frieren) });
      await waitFor(() => expect(screen.getByRole("combobox", { name: /What KOL reacted to/ })).toHaveValue("Frieren · Anime"));
      save();

      expect((await screen.findByRole("alert")).closest("[data-slot=field]")).toBeNull();
      expect(callsTo("tags.save")).toEqual([]);
    });
  });

  describe("reacting to a youTube channel", () => {
    it("fills the video's details from the reaction", async () => {
      renderDialog({ tag: videoTag });

      await waitFor(() => expect(screen.getByRole("textbox", { name: "Video title" })).toHaveValue("Funny video"));
      expect(screen.getByRole("textbox", { name: "Video ID or link" })).toHaveValue("abc123");
      expect(screen.getByRole("textbox", { name: "Label" })).toHaveValue("Funniest moments");
      expect(screen.getByRole("textbox", { name: "Other video titles" })).toHaveValue("Funny\nFunny video 2");
      expect(screen.getByText("One per line. The shortest shows on the chip")).toBeInTheDocument();
      expect(screen.queryByRole("textbox", { name: /Other titles of/ })).not.toBeInTheDocument();
    });

    it("starts a reaction without a video's details", async () => {
      renderDialog({ tag: new Tag({ id: "t2", entryId: "e3", label: "Plain", description: "", startTime: 5, endTime: 50, context: {} }, kol) });

      await waitFor(() => expect(screen.getByRole("textbox", { name: "Video title" })).toHaveValue(""));
      expect(screen.getByRole("textbox", { name: "Video ID or link" })).toHaveValue("");
      expect(screen.getByRole("textbox", { name: "Other video titles" })).toHaveValue("");
    });

    it("saves the video's details with the reaction, never as the entry's", async () => {
      const onClose = vi.fn();

      renderDialog({ tag: videoTag, onClose });
      await waitFor(() => expect(screen.getByRole("textbox", { name: "Video title" })).toHaveValue("Funny video"));
      fireEvent.change(screen.getByRole("textbox", { name: "Video title" }), { target: { value: "  Renamed  " } });
      fireEvent.change(screen.getByRole("textbox", { name: "Video ID or link" }), { target: { value: "https://youtu.be/xyz789" } });
      fireEvent.change(screen.getByRole("textbox", { name: "Other video titles" }), { target: { value: "One\n\n Two " } });
      save();

      await waitFor(() => expect(onClose).toHaveBeenCalledExactlyOnceWith(true));
      expect(callsTo("entries.save")).toEqual([]);
      expect(callsTo("tags.save")).toEqual([{
        postId: "post-1001",
        tag: { id: "t2", entryId: "e3", label: "Funniest moments", description: "", startTime: 5, endTime: 50, context: { title: "Renamed", videoId: "xyz789", altTitles: ["One", "Two"] } },
      }]);
    });

    it("leaves out the details that were cleared", async () => {
      const onClose = vi.fn();

      renderDialog({ tag: videoTag, onClose });
      await waitFor(() => expect(screen.getByRole("textbox", { name: "Video title" })).toHaveValue("Funny video"));
      fireEvent.change(screen.getByRole("textbox", { name: "Video title" }), { target: { value: "  " } });
      fireEvent.change(screen.getByRole("textbox", { name: "Video ID or link" }), { target: { value: "" } });
      fireEvent.change(screen.getByRole("textbox", { name: "Other video titles" }), { target: { value: "\n" } });
      save();

      await waitFor(() => expect(onClose).toHaveBeenCalledExactlyOnceWith(true));
      expect(callsTo("tags.save")).toEqual([{
        postId: "post-1001",
        tag: { id: "t2", entryId: "e3", label: "Funniest moments", description: "", startTime: 5, endTime: 50, context: {} },
      }]);
    });

    it("shows a problem with the video's details under them", async () => {
      renderDialog({ tag: videoTag });
      await waitFor(() => expect(screen.getByRole("textbox", { name: "Video title" })).toHaveValue("Funny video"));
      fireEvent.change(screen.getByRole("textbox", { name: "Other video titles" }), { target: { value: "x".repeat(301) } });
      save();

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(callsTo("tags.save")).toEqual([]);
    });

    it("follows the channel picked: no video titles of another channel", async () => {
      renderDialog({ tag: videoTag });
      await waitFor(() => expect(screen.getByRole("textbox", { name: "Other video titles" })).toHaveValue("Funny\nFunny video 2"));

      await pickEntry("other", /Other Channel/);

      await waitFor(() => expect(screen.getByRole("textbox", { name: "Other video titles" })).toHaveValue(""));
    });

    it("keeps no entry titles in the video's titles when adding", async () => {
      renderDialog();

      await pickEntry("kol", /KOL/);

      expect(screen.getByRole("textbox", { name: "Other video titles" })).toHaveValue("");
      expect(screen.getByRole("textbox", { name: "Label" })).toBeInTheDocument();
    });
  });

  describe("editing entries", () => {
    it("creates an entry from what was typed, and picks it", async () => {
      const uuid = "00000000-0000-4000-8000-000000000009";

      vi.spyOn(crypto, "randomUUID").mockReturnValueOnce(uuid);
      requestMock.mockImplementation((async (method: string, payload: { entry?: TEntry }) => {
        if (method === "entries.save" && payload.entry) {
          models = [...models, payload.entry];
        }

        return method === "entries.list" ? models : null;
      }) as never);
      renderDialog();

      fireEvent.input(screen.getByRole("combobox", { name: /What KOL reacted to/ }), { target: { value: "Brand New" }, inputType: "insertText" });
      fireEvent.click(screen.getByLabelText("new entry"));

      expect(screen.getByRole("heading", { name: "New entry" })).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "Add a reaction" })).not.toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: /Title/ })).toHaveValue("Brand New");

      fireEvent.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => expect(screen.getByRole("heading", { name: "Add a reaction" })).toBeInTheDocument());
      await waitFor(() => expect(screen.getByRole("combobox", { name: /What KOL reacted to/ })).toHaveValue("Brand New · Anime"));
      expect(callsTo("entries.save")).toEqual([{ entry: { id: uuid, type: EEntryType.ANIME, title: "Brand New", altTitles: [] } }]);
      expect(screen.getByRole("textbox", { name: "Episode" })).toBeInTheDocument();
    });

    it("forgets the entry when the picker is emptied", async () => {
      renderDialog();
      await pickEntry("matrix", /The Matrix/);
      expect(screen.getByLabelText("edit entry")).toBeInTheDocument();

      fireEvent.input(screen.getByRole("combobox", { name: /What KOL reacted to/ }), { target: { value: "" }, inputType: "deleteContentBackward" });

      await waitFor(() => expect(screen.queryByLabelText("edit entry")).not.toBeInTheDocument());
      expect(screen.getByRole("textbox", { name: "Label" })).toBeInTheDocument();
      expect(screen.queryByRole("textbox", { name: /Other titles/ })).not.toBeInTheDocument();
    });

    it("starts a new entry empty once an entry is picked", async () => {
      renderDialog();
      await pickEntry("matrix", /The Matrix/);

      fireEvent.click(screen.getByLabelText("new entry"));

      expect(screen.getByRole("heading", { name: "New entry" })).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: /Title/ })).toHaveValue("");
    });

    it("edits the entry picked", async () => {
      renderDialog();
      await pickEntry("matrix", /The Matrix/);

      fireEvent.click(screen.getByRole("button", { name: "edit entry" }));

      expect(screen.getByRole("heading", { name: "Edit entry" })).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: /Title/ })).toHaveValue("The Matrix");
    });

    it("goes back to the reaction, unchanged, when the entry editor is cancelled", async () => {
      renderDialog();
      await pickEntry("matrix", /The Matrix/);
      fireEvent.click(screen.getByRole("button", { name: "edit entry" }));

      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

      await waitFor(() => expect(screen.getByRole("heading", { name: "Add a reaction" })).toBeInTheDocument());
      expect(screen.getByRole("combobox", { name: /What KOL reacted to/ })).toHaveValue("The Matrix · Movie");
      expect(callsTo("entries.save")).toEqual([]);
    });
  });
});
