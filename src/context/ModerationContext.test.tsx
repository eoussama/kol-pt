import type { TEntry } from "../core/schemas/entry/entry.schema";
import type { TReport } from "../core/schemas/moderation.schema";
import type { IModerationContext } from "./ModerationContext";

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createEntry } from "../core/domain/hydrate";
import { Post } from "../core/domain/post";
import { Tag } from "../core/domain/tag";
import { EEntryType } from "../core/enums/entry-type.enum";
import { request } from "../core/messaging/client";
import { useEntriesStore } from "../state/entries.state";
import { useReportsStore } from "../state/reports.state";
import { ModerationProvider, useModeration } from "./ModerationContext";



vi.mock("../core/messaging/client", () => ({ request: vi.fn() }));
vi.mock("../content/player/PlayerProvider", () => ({ usePlayer: () => ({ ready: true, currentTime: 754.6 }) }));

const requestMock = vi.mocked(request);

const frierenModel = { id: "e1", type: EEntryType.ANIME, title: "Frieren", altTitles: [] } as unknown as TEntry;
const matrixModel = { id: "e2", type: EEntryType.MOVIE, title: "The Matrix", altTitles: [] } as unknown as TEntry;
const frieren = createEntry(frierenModel);
const matrix = createEntry(matrixModel);

const episode = new Tag({ id: "t1", entryId: "e1", label: "4", description: "Hover", startTime: 60, endTime: 120, context: {} }, frieren);
const opening = new Tag({ id: "t2", entryId: "e2", label: "Opening", description: "", startTime: 200, endTime: 300, context: {} }, matrix);
const post = new Post({ id: "anime-tonight-1001", title: "Anime Tonight", description: "All about anime", creationDate: new Date(2024, 0, 15, 13, 45).getTime(), thumbnail: "https://example.com/a.jpg", tags: [] }, [episode, opening]);

/**
 * @description
 * Builds a report about the post.
 *
 * @param id - The report's ID
 * @param fields - What the report says
 * @returns The report
 */
function reportWith(id: string, fields: Partial<TReport>): TReport {
  return { id, kind: "untracked", postId: "1001", postTitle: "Anime Tonight", note: "", reporterUid: "u1", reporterName: "Viewer", createdAt: 0, ...fields };
}

const reports = [
  reportWith("r1", { kind: "timestamp", tagId: "t1", tagTitle: "Frieren — Episode 4", startTime: 70, endTime: 130 }),
  reportWith("r2", { kind: "entry", tagId: "t1", tagTitle: "Frieren — Episode 4", note: "It is episode 5" }),
  reportWith("r3", { kind: "missing", note: "One Piece", startTime: 5, endTime: 9 }),
  reportWith("r4", { kind: "untracked" }),
  reportWith("r5", { kind: "timestamp", tagId: "gone", tagTitle: "Removed reaction" }),
  reportWith("r6", { kind: "timestamp", tagId: "t2", tagTitle: "The Matrix — Opening" }),
  reportWith("r7", { kind: "missing", postId: "2002", note: "Another post" }),
];

let actions: IModerationContext;

/**
 * @description
 * Hands the moderation actions to the test.
 *
 * @returns A child to render
 */
function Actions(): JSX.Element {
  actions = useModeration();

  return <p>child</p>;
}

/**
 * @description
 * Renders the provider for the post.
 *
 * @returns The rerender function
 */
function renderProvider() {
  const view = render(<ModerationProvider post={post}><Actions /></ModerationProvider>);

  return (next: Post = post) => view.rerender(<ModerationProvider post={next}><Actions /></ModerationProvider>);
}

/**
 * @description
 * Runs an action of the context as a click would.
 *
 * @param run - The action to run
 */
function perform(run: () => void): void {
  fireEvent.click(Object.assign(document.createElement("button"), { onclick: run }));
}

describe("moderationProvider", () => {
  beforeEach(() => {
    requestMock.mockReset();
    requestMock.mockImplementation((async (method: string) => method === "entries.list" ? [frierenModel, matrixModel] : null) as never);
    useEntriesStore.setState({ entries: [frieren, matrix], loading: false, error: false });
    useReportsStore.setState({ reports });
  });

  it("renders its children", () => {
    renderProvider();

    expect(screen.getByText("child")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("keeps its actions as they are between renders", () => {
    const rerender = renderProvider();
    const before = actions;

    rerender();

    expect(actions).toBe(before);
  });

  it("acts on the post it is given, as that changes", async () => {
    const rerender = renderProvider();
    const other = new Post({ id: "other-2002", title: "Other Post", description: "", creationDate: 0, thumbnail: "", tags: [] }, [opening]);

    rerender(other);

    perform(() => actions.untrackPost());
    expect(screen.getByRole("alertdialog", { name: "Stop tracking this post?" })).toHaveTextContent("“Other Post” and its 1 reactions will be removed for everyone.");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());

    perform(() => actions.deleteTag(opening));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(requestMock).toHaveBeenCalledExactlyOnceWith("tags.delete", { postId: "other-2002", tagId: "t2" }));
  });

  describe("reporting", () => {
    it("reports a reaction", () => {
      renderProvider();
      perform(() => actions.report("timestamp", episode));

      expect(screen.getByRole("heading", { name: "Report a problem" })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /Wrong timestamp/ })).toBeChecked();
      expect(screen.getByRole("textbox", { name: "Starts at" })).toHaveValue("0:01:00");
    });

    it("reports the post, about nothing in particular", () => {
      renderProvider();
      perform(() => actions.report("missing"));

      expect(screen.getByRole("heading", { name: "Missing reaction" })).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: "Starts at" })).toHaveValue("");
    });

    it("sends the report about this post", async () => {
      renderProvider();
      perform(() => actions.report("untracked"));
      fireEvent.click(screen.getByRole("button", { name: "Send report" }));

      await waitFor(() => expect(requestMock).toHaveBeenCalledWith("reports.create", {
        report: expect.objectContaining({ kind: "untracked", postId: "anime-tonight-1001", postTitle: "Anime Tonight" }),
      }));
    });

    it("closes the report form", async () => {
      renderProvider();
      perform(() => actions.report("missing"));
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });
  });

  describe("editing", () => {
    it("adds a reaction", () => {
      renderProvider();
      perform(() => actions.editTag(null));

      expect(screen.getByRole("heading", { name: "Add a reaction" })).toBeInTheDocument();
    });

    it("edits a reaction", async () => {
      renderProvider();
      perform(() => actions.editTag(episode));

      expect(screen.getByRole("heading", { name: "Edit reaction" })).toBeInTheDocument();
      await waitFor(() => expect(screen.getByRole("textbox", { name: "Episode" })).toHaveValue("4"));
    });

    it("saves a reaction to this post, and closes", async () => {
      renderProvider();
      perform(() => actions.editTag(episode));
      await waitFor(() => expect(screen.getByRole("combobox", { name: /What KOL reacted to/ })).toHaveValue("Frieren · Anime"));
      fireEvent.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => expect(requestMock).toHaveBeenCalledWith("tags.save", { postId: "anime-tonight-1001", tag: expect.objectContaining({ id: "t1" }) }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(requestMock).not.toHaveBeenCalledWith("reports.resolve", expect.anything());
    });

    it("closes the reaction editor", async () => {
      renderProvider();
      perform(() => actions.editTag(null));
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("edits the post's details", () => {
      renderProvider();
      perform(() => actions.editPost());

      expect(screen.getByRole("heading", { name: "Edit post details" })).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: /Title/ })).toHaveValue("Anime Tonight");
      expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue("All about anime");
      expect(screen.getByLabelText(/Posted on/)).toHaveValue("2024-01-15T13:45");
      expect(screen.getByRole("textbox", { name: "Thumbnail link" })).toHaveValue("https://example.com/a.jpg");
    });

    it("closes the post's details", async () => {
      renderProvider();
      perform(() => actions.editPost());
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("saves the post's details, and closes", async () => {
      renderProvider();
      perform(() => actions.editPost());
      fireEvent.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => expect(requestMock).toHaveBeenCalledWith("posts.save", { post: expect.objectContaining({ id: "anime-tonight-1001", title: "Anime Tonight" }) }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });
  });

  describe("removing", () => {
    it("asks before deleting a reaction, then deletes it", async () => {
      renderProvider();
      perform(() => actions.deleteTag(episode));

      expect(screen.getByRole("alertdialog", { name: "Delete this reaction?" })).toHaveTextContent("“Frieren — Episode 4” will be removed for everyone.");
      expect(requestMock).not.toHaveBeenCalledWith("tags.delete", expect.anything());

      fireEvent.click(screen.getByRole("button", { name: "Delete" }));

      await waitFor(() => expect(requestMock).toHaveBeenCalledExactlyOnceWith("tags.delete", { postId: "anime-tonight-1001", tagId: "t1" }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    });

    it("asks before the post is untracked, then untracks it", async () => {
      renderProvider();
      perform(() => actions.untrackPost());

      expect(screen.getByRole("alertdialog", { name: "Stop tracking this post?" })).toHaveTextContent("“Anime Tonight” and its 2 reactions will be removed for everyone.");

      fireEvent.click(screen.getByRole("button", { name: "Stop tracking" }));

      await waitFor(() => expect(requestMock).toHaveBeenCalledExactlyOnceWith("posts.delete", { postId: "anime-tonight-1001" }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    });

    it("leaves things as they are when the question is cancelled", async () => {
      renderProvider();
      perform(() => actions.untrackPost());
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(requestMock).not.toHaveBeenCalledWith("posts.delete", expect.anything());
    });

    it("keeps asking, with the reason, when removing fails", async () => {
      requestMock.mockRejectedValueOnce(new Error("Offline"));
      renderProvider();
      perform(() => actions.untrackPost());
      fireEvent.click(screen.getByRole("button", { name: "Stop tracking" }));

      expect(await screen.findByRole("alert")).toHaveTextContent("Offline");
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });
  });

  describe("reviewing reports", () => {
    it("lists the reports about the post itself", () => {
      renderProvider();
      perform(() => actions.review());

      expect(screen.getByRole("heading", { name: "Reports on this post" })).toBeInTheDocument();

      const items = screen.getAllByRole("listitem");

      expect(items).toHaveLength(2);
      expect(items[0]).toHaveTextContent("Missing reaction");
      expect(items[1]).toHaveTextContent("Untracked post");
    });

    it("lists the reports about a reaction, under its name", () => {
      renderProvider();
      perform(() => actions.review("t1"));

      expect(screen.getByRole("heading", { name: "Reports on Frieren — Episode 4" })).toBeInTheDocument();

      const items = screen.getAllByRole("listitem");

      expect(items).toHaveLength(2);
      expect(items[0]).toHaveTextContent("Wrong timestamp");
      expect(items[1]).toHaveTextContent("Wrong show or episode");
    });

    it("lists the reports about a reaction that is gone, under the post's name", () => {
      renderProvider();
      perform(() => actions.review("gone"));

      expect(screen.getByRole("heading", { name: "Reports on this post" })).toBeInTheDocument();
      expect(screen.getByRole("listitem")).toHaveTextContent("Removed reaction");
    });

    it("dismisses a report", async () => {
      renderProvider();
      perform(() => actions.review("t2"));
      fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

      await waitFor(() => expect(requestMock).toHaveBeenCalledExactlyOnceWith("reports.resolve", { reportId: "r6" }));
    });

    it("closes the review", async () => {
      renderProvider();
      perform(() => actions.review());
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("offers to fix the reports that can be", () => {
      renderProvider();
      perform(() => actions.review("t1"));

      const [timestamp, entry] = screen.getAllByRole("listitem");

      expect(within(timestamp!).getByRole("button", { name: "Fix" })).toBeInTheDocument();
      expect(within(entry!).getByRole("button", { name: "Fix" })).toBeInTheDocument();
    });

    it("offers to fix a missing reaction, but not an untracked post", () => {
      renderProvider();
      perform(() => actions.review());

      const [missing, untracked] = screen.getAllByRole("listitem");

      expect(within(missing!).getByRole("button", { name: "Fix" })).toBeInTheDocument();
      expect(within(untracked!).queryByRole("button", { name: "Fix" })).not.toBeInTheDocument();
    });

    it("offers no fix for an untracked post, even when it names a reaction", () => {
      useReportsStore.setState({ reports: [reportWith("r8", { kind: "untracked", tagId: "t1" })] });
      renderProvider();
      perform(() => actions.review("t1"));

      expect(screen.getAllByRole("listitem")).toHaveLength(1);
      expect(screen.queryByRole("button", { name: "Fix" })).not.toBeInTheDocument();
    });

    it("offers no fix for a report that names no reaction", () => {
      useReportsStore.setState({ reports: [reportWith("r8", { kind: "timestamp" }), reportWith("r9", { kind: "entry" })] });
      renderProvider();
      perform(() => actions.review());

      expect(screen.getAllByRole("listitem")).toHaveLength(2);
      expect(screen.queryByRole("button", { name: "Fix" })).not.toBeInTheDocument();
    });

    it("offers no fix for a report about a reaction that is gone", () => {
      renderProvider();
      perform(() => actions.review("gone"));

      expect(screen.queryByRole("button", { name: "Fix" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
    });
  });

  describe("fixing a report", () => {
    it("fixes a wrong timestamp with the times suggested", async () => {
      renderProvider();
      perform(() => actions.review("t1"));
      fireEvent.click(within(screen.getAllByRole("listitem")[0]!).getByRole("button", { name: "Fix" }));

      expect(await screen.findByRole("heading", { name: "Edit reaction" })).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "Reports on Frieren — Episode 4" })).not.toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: "Starts at" })).toHaveValue("0:01:10");
      expect(screen.getByRole("textbox", { name: "Ends at" })).toHaveValue("0:02:10");
    });

    it("closes the report once the fix is saved", async () => {
      renderProvider();
      perform(() => actions.review("t1"));
      fireEvent.click(within(screen.getAllByRole("listitem")[0]!).getByRole("button", { name: "Fix" }));
      await waitFor(() => expect(screen.getByRole("combobox", { name: /What KOL reacted to/ })).toHaveValue("Frieren · Anime"));
      fireEvent.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => expect(requestMock).toHaveBeenCalledWith("reports.resolve", { reportId: "r1" }));
      expect(requestMock).toHaveBeenCalledWith("tags.save", { postId: "anime-tonight-1001", tag: expect.objectContaining({ id: "t1", startTime: 70, endTime: 130 }) });
      expect(requestMock.mock.calls.findIndex(([name]) => name === "tags.save")).toBeLessThan(requestMock.mock.calls.findIndex(([name]) => name === "reports.resolve"));
    });

    it("keeps the reaction's own times to fix a wrong show or episode", async () => {
      renderProvider();
      perform(() => actions.review("t1"));
      fireEvent.click(within(screen.getAllByRole("listitem")[1]!).getByRole("button", { name: "Fix" }));

      expect(await screen.findByRole("heading", { name: "Edit reaction" })).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: "Starts at" })).toHaveValue("0:01:00");
      expect(screen.getByRole("textbox", { name: "Ends at" })).toHaveValue("0:02:00");
    });

    it("ignores the times a wrong show or episode report carries", async () => {
      useReportsStore.setState({ reports: [reportWith("r8", { kind: "entry", tagId: "t1", tagTitle: "Frieren — Episode 4", startTime: 900, endTime: 1000 })] });
      renderProvider();
      perform(() => actions.review("t1"));
      fireEvent.click(screen.getByRole("button", { name: "Fix" }));

      expect(await screen.findByRole("heading", { name: "Edit reaction" })).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: "Starts at" })).toHaveValue("0:01:00");
      expect(screen.getByRole("textbox", { name: "Ends at" })).toHaveValue("0:02:00");
    });

    it("adds the reaction a report says is missing, with its times", async () => {
      renderProvider();
      perform(() => actions.review());
      fireEvent.click(within(screen.getAllByRole("listitem")[0]!).getByRole("button", { name: "Fix" }));

      expect(await screen.findByRole("heading", { name: "Add a reaction" })).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: "Starts at" })).toHaveValue("0:00:05");
      expect(screen.getByRole("textbox", { name: "Ends at" })).toHaveValue("0:00:09");
      expect(screen.getByRole("combobox", { name: /What KOL reacted to/ })).toHaveValue("");
    });

    it("leaves the report open when the fix is cancelled", async () => {
      renderProvider();
      perform(() => actions.review("t1"));
      fireEvent.click(within(screen.getAllByRole("listitem")[0]!).getByRole("button", { name: "Fix" }));
      fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(requestMock).not.toHaveBeenCalledWith("reports.resolve", expect.anything());
    });

    it("still closes the editor when the report cannot be closed", async () => {
      requestMock.mockImplementation((async (method: string) => {
        if (method === "reports.resolve") {
          throw new Error("Offline");
        }

        return method === "entries.list" ? [frierenModel, matrixModel] : null;
      }) as never);
      renderProvider();
      perform(() => actions.review("t1"));
      fireEvent.click(within(screen.getAllByRole("listitem")[0]!).getByRole("button", { name: "Fix" }));
      await waitFor(() => expect(screen.getByRole("combobox", { name: /What KOL reacted to/ })).toHaveValue("Frieren · Anime"));
      fireEvent.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => expect(requestMock).toHaveBeenCalledWith("reports.resolve", { reportId: "r1" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });
  });
});

describe("useModeration", () => {
  it("does nothing outside a provider", () => {
    render(<Actions />);

    expect(actions.report("missing")).toBeUndefined();
    expect(actions.editTag(null)).toBeUndefined();
    expect(actions.deleteTag(episode)).toBeUndefined();
    expect(actions.editPost()).toBeUndefined();
    expect(actions.untrackPost()).toBeUndefined();
    expect(actions.review()).toBeUndefined();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
