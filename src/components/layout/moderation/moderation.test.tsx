import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Tag } from "../../../core/domain/tag";
import { EEntryType } from "../../../core/enums/entry-type.enum";
import { request } from "../../../core/messaging/client";
import { toEntryInput } from "./EntryEditorDialog";
import { toYouTubeVideoId } from "./ReactionEditorDialog";
import ReportDialog from "./ReportDialog";



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
    expect(toEntryInput("e1", { ...form, cover: "https://image.tmdb.org/t/p/w500/a.jpg" })).toMatchObject({ entry: { cover: "https://image.tmdb.org/t/p/w500/a.jpg" } });
    expect(toEntryInput("e1", { ...form, cover: "http://image.tmdb.org/a.jpg" })).toHaveProperty("error");
    expect(toEntryInput("e1", { ...form, cover: "https://evil.example/a.jpg" })).toHaveProperty("error");
    expect(toEntryInput("e1", { ...form, type: EEntryType.TV_SHOW, malId: "52991" })).toEqual({ entry: { id: "e1", type: EEntryType.TV_SHOW, title: "Frieren", altTitles: ["Sousou no Frieren"] } });
    expect(toEntryInput("e1", { ...form, title: "  " })).toHaveProperty("error");
  });
});
