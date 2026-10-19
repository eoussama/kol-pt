import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Tag } from "../../../core/domain/tag";
import { EEntryType } from "../../../core/enums/entry-type.enum";
import { request } from "../../../core/messaging/client";
import ConfirmDialog from "./ConfirmDialog";
import EntryEditorDialog, { toEntryInput } from "./EntryEditorDialog";
import PostDetailsDialog from "./PostDetailsDialog";
import ReactionEditorDialog, { toYouTubeVideoId } from "./ReactionEditorDialog";
import ReportDialog from "./ReportDialog";
import ReportsReviewDialog from "./ReportsReviewDialog";



vi.mock("../../../core/messaging/client", () => ({ request: vi.fn(async () => null) }));
vi.mock("../../../content/player/PlayerProvider", () => ({ usePlayer: () => ({ ready: true, currentTime: 754.6 }) }));

const tag = new Tag({ id: "t1", entryId: "e1", label: "Ep 4", description: "", startTime: 60, endTime: 120, context: {} }, null);
const post = { id: "post-1001", title: "Anime Tonight" };

describe("reportDialog", () => {
  beforeEach(() => {
    vi.mocked(request).mockClear();
  });

  it("reports a reaction's timestamp with times taken from the video", async () => {
    render(<ReportDialog open kind="timestamp" post={post} tag={tag} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Set ends at from the video" }));
    fireEvent.click(screen.getByRole("button", { name: "Send report" }));

    await waitFor(() => expect(request).toHaveBeenCalledWith("reports.create", {
      report: expect.objectContaining({ kind: "timestamp", postId: "post-1001", tagId: "t1", startTime: 60, endTime: 754, note: "" }),
    }));
    expect(await screen.findByText(/A moderator will look at it/)).toBeInTheDocument();
  });

  it("needs a note to report a missing reaction, and names no reaction", async () => {
    render(<ReportDialog open kind="missing" post={post} onClose={vi.fn()} />);

    const send = screen.getByRole("button", { name: "Send report" });

    expect(send).toBeDisabled();

    fireEvent.change(screen.getByRole("textbox", { name: /What did KOL react to/ }), { target: { value: "One Piece 1100" } });
    fireEvent.click(send);

    await waitFor(() => expect(request).toHaveBeenCalled());
    expect(vi.mocked(request).mock.calls[0]?.[1]).toEqual({ report: expect.objectContaining({ kind: "missing", tagId: undefined, note: "One Piece 1100" }) });
  });

  it("shows why a report was refused", async () => {
    vi.mocked(request).mockRejectedValueOnce(new Error("You already reported this. A moderator will look at it soon."));
    render(<ReportDialog open kind="untracked" post={post} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Send report" }));

    expect(await screen.findByText(/already reported/)).toBeInTheDocument();
  });
});

describe("moderation dialogs", () => {
  beforeEach(() => {
    vi.mocked(request).mockClear();
  });

  it("keeps the confirm dialog open with the error when the action fails", async () => {
    const onClose = vi.fn();

    render(<ConfirmDialog open title="Delete this reaction?" message="It cannot be undone." confirmLabel="Delete" onConfirm={async () => Promise.reject(new Error("Offline"))} onClose={onClose} />);

    expect(screen.getByRole("alertdialog", { name: "Delete this reaction?" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("Offline")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("shows an entry's problem under its field", async () => {
    render(<EntryEditorDialog open entry={null} initialTitle="Frieren" onClose={vi.fn()} />);

    expect(screen.getByRole("textbox", { name: /Title/ })).toHaveValue("Frieren");
    fireEvent.change(screen.getByRole("textbox", { name: "MyAnimeList ID" }), { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect((await screen.findByRole("alert")).closest("[data-slot=field]")).toHaveTextContent("MyAnimeList ID");
    expect(screen.getByRole("textbox", { name: "MyAnimeList ID" })).toHaveAttribute("aria-invalid", "true");
    expect(request).not.toHaveBeenCalled();
  });

  it("shows a post's problem under its field", async () => {
    render(<PostDetailsDialog open tracked={false} post={{ id: "post-1001", title: "Anime Tonight", description: "", creationDate: Date.now(), thumbnail: "http://example.com/a.jpg" }} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Track post" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The thumbnail must be an https link");
    expect(screen.getByRole("textbox", { name: "Thumbnail link" })).toHaveAttribute("aria-invalid", "true");
    expect(request).not.toHaveBeenCalled();
  });

  it("picks a reaction's entry from the list", async () => {
    // Only the entries are requested until the reaction is saved
    vi.mocked(request).mockResolvedValueOnce([{ id: "e1", type: EEntryType.MOVIE, title: "Frieren", altTitles: [] }] as never);
    render(<ReactionEditorDialog open postId="post-1001" tag={null} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Pick what KOL reacted to")).toBeInTheDocument();

    const picker = screen.getByRole("combobox", { name: /What KOL reacted to/ });

    fireEvent.input(picker, { target: { value: "Frie" }, inputType: "insertText" });
    expect(await screen.findByRole("option", { name: /Frieren/ })).toBeInTheDocument();
    fireEvent.keyDown(picker, { key: "ArrowDown" });
    fireEvent.keyDown(picker, { key: "Enter" });

    await waitFor(() => expect(picker).toHaveValue("Frieren · Movie"));
    expect(screen.getByRole("button", { name: "edit entry" })).toBeInTheDocument();
  });

  it("lists reports, and dismisses one", async () => {
    const report = { id: "r1", kind: "timestamp", postId: "post-1001", postTitle: "Anime Tonight", note: "Starts later", startTime: 10, createdAt: Date.now(), reporterName: "Viewer" } as const;
    const props = { open: true, title: "Open reports", onApply: vi.fn(), canApply: () => true, onClose: vi.fn() };
    const { rerender } = render(<ReportsReviewDialog {...props} reports={[]} />);

    expect(screen.getByText("No open reports.")).toBeInTheDocument();

    rerender(<ReportsReviewDialog {...props} reports={[report as never]} />);
    expect(screen.getByText("Suggested: 0:00:10 → ?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Fix" }));
    expect(props.onApply).toHaveBeenCalledWith(report);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    await waitFor(() => expect(request).toHaveBeenCalledWith("reports.resolve", { reportId: "r1" }));
  });
});

describe("editor helpers", () => {
  it("reads YouTube video ids from links", () => {
    expect(toYouTubeVideoId("https://www.youtube.com/watch?v=abc123&t=5")).toBe("abc123");
    expect(toYouTubeVideoId("https://youtu.be/abc123")).toBe("abc123");
    expect(toYouTubeVideoId("https://www.youtube.com/shorts/abc-123")).toBe("abc-123");
    expect(toYouTubeVideoId(" abc123 ")).toBe("abc123");
  });

  it("keeps only the entry type's own fields", () => {
    const form = { type: EEntryType.ANIME, title: " Frieren ", altTitles: "Sousou no Frieren\n\n", imdbId: "", cover: "", malId: "52991", anilistId: "", kitsuId: "", handle: "stale", channelId: "", rottentomatoesId: "" };

    expect(toEntryInput("e1", form)).toEqual({ entry: { id: "e1", type: EEntryType.ANIME, title: "Frieren", altTitles: ["Sousou no Frieren"], malId: 52991 } });
    expect(toEntryInput("e1", { ...form, malId: "abc" })).toHaveProperty("error");
    expect(toEntryInput("e1", { ...form, malId: "abc" })).toMatchObject({ field: "malId" });
    expect(toEntryInput("e1", { ...form, cover: "https://image.tmdb.org/t/p/w500/a.jpg" })).toMatchObject({ entry: { cover: "https://image.tmdb.org/t/p/w500/a.jpg" } });
    expect(toEntryInput("e1", { ...form, cover: "http://image.tmdb.org/a.jpg" })).toHaveProperty("error");
    expect(toEntryInput("e1", { ...form, cover: "https://evil.example/a.jpg" })).toHaveProperty("error");
    expect(toEntryInput("e1", { ...form, type: EEntryType.TV_SHOW, malId: "52991" })).toEqual({ entry: { id: "e1", type: EEntryType.TV_SHOW, title: "Frieren", altTitles: ["Sousou no Frieren"] } });
    expect(toEntryInput("e1", { ...form, title: "  " })).toHaveProperty("error");
  });
});
