import type { TReportKind } from "../../../core/schemas/moderation.schema";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Tag } from "../../../core/domain/tag";
import { request } from "../../../core/messaging/client";
import ReportDialog from "./ReportDialog";



vi.mock("../../../core/messaging/client", () => ({ request: vi.fn() }));
vi.mock("../../../content/player/PlayerProvider", () => ({ usePlayer: () => ({ ready: true, currentTime: 754.6 }) }));

const requestMock = vi.mocked(request);

const tag = new Tag({ id: "t1", entryId: "e1", label: "Ep 4", description: "", startTime: 60, endTime: 120, context: {} }, null);
const post = { id: "post-1001", title: "Anime Tonight" };

/**
 * @description
 * Renders an open report dialog.
 *
 * @param props - What to override
 * @param props.kind - What is reported
 * @param props.tag - The reaction reported
 * @param props.onClose - Called when the dialog closes
 * @param props.post - The post reported
 * @param props.post.id - The post's ID
 * @param props.post.title - The post's title
 * @returns The rerender function
 */
function renderDialog(props: { kind: TReportKind; tag?: Tag; onClose?: () => void; post?: { id: string; title: string } }) {
  const onClose = props.onClose ?? vi.fn();
  const element = (open: boolean) => <ReportDialog open={open} kind={props.kind} post={props.post ?? post} tag={props.tag} onClose={onClose} />;
  const view = render(element(true));

  return (open: boolean) => view.rerender(element(open));
}

const send = () => fireEvent.click(screen.getByRole("button", { name: "Send report" }));

/**
 * @description
 * Finds a button of the dialog's footer, as the dialog's own close button
 * shares the name "Close".
 *
 * @param name - The button's name
 * @returns The button
 */
function footerButton(name: string): HTMLElement {
  return screen.getAllByRole("button", { name }).find(button => button.closest("[data-slot=dialog-footer]") !== null)!;
}

describe("reportDialog", () => {
  beforeEach(() => {
    requestMock.mockReset();
    requestMock.mockResolvedValue(null as never);
  });

  it("reports a reaction's timestamp with the times it has", async () => {
    renderDialog({ kind: "timestamp", tag });

    expect(screen.getByRole("heading", { name: "Report a problem" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Starts at" })).toHaveValue("0:01:00");
    expect(screen.getByRole("textbox", { name: "Ends at" })).toHaveValue("0:02:00");

    send();

    await waitFor(() => expect(requestMock).toHaveBeenCalledExactlyOnceWith("reports.create", {
      report: { kind: "timestamp", postId: "post-1001", postTitle: "Anime Tonight", tagId: "t1", tagTitle: "Ep 4 — Ep 4", note: "", startTime: 60, endTime: 120 },
    }));
  });

  it("sends the times and note typed", async () => {
    renderDialog({ kind: "timestamp", tag });

    fireEvent.change(screen.getByRole("textbox", { name: "Starts at" }), { target: { value: "1:30" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Ends at" }), { target: { value: "3:00" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Note" }), { target: { value: "  Starts later  " } });
    send();

    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("reports.create", {
      report: expect.objectContaining({ kind: "timestamp", startTime: 90, endTime: 180, note: "Starts later" }),
    }));
  });

  it("thanks the viewer once the report is sent, and can then be closed", async () => {
    const onClose = vi.fn();

    renderDialog({ kind: "untracked", onClose });
    send();

    expect(await screen.findByText("Thanks! A moderator will look at it.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send report" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Note" })).not.toBeInTheDocument();

    fireEvent.click(footerButton("Close"));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("reports a reaction's show or episode without times", async () => {
    renderDialog({ kind: "timestamp", tag });

    fireEvent.click(screen.getByRole("radio", { name: /Wrong show or episode/ }));

    expect(screen.queryByRole("textbox", { name: "Starts at" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /What is it really/ })).toBeRequired();
    expect(screen.getByRole("button", { name: "Send report" })).toBeDisabled();

    fireEvent.change(screen.getByRole("textbox", { name: /What is it really/ }), { target: { value: "Episode 5" } });
    send();

    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("reports.create", {
      report: { kind: "entry", postId: "post-1001", postTitle: "Anime Tonight", tagId: "t1", tagTitle: "Ep 4 — Ep 4", note: "Episode 5", startTime: undefined, endTime: undefined },
    }));
  });

  it("starts with the kind it is given", () => {
    renderDialog({ kind: "entry", tag });

    expect(screen.getByRole("radio", { name: /Wrong show or episode/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Wrong timestamp/ })).not.toBeChecked();
  });

  it("offers a choice of kind only for a reaction", () => {
    renderDialog({ kind: "untracked" });

    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Track this post" })).toBeInTheDocument();
    expect(screen.getByText("Ask the moderators to add this post's reactions.")).toBeInTheDocument();
  });

  it("reports an untracked post with an optional note and no times", async () => {
    renderDialog({ kind: "untracked" });

    expect(screen.queryByRole("textbox", { name: "Starts at" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Note" })).not.toBeRequired();

    send();

    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("reports.create", {
      report: { kind: "untracked", postId: "post-1001", postTitle: "Anime Tonight", tagId: undefined, tagTitle: undefined, note: "", startTime: undefined, endTime: undefined },
    }));
  });

  it("needs a note to report a missing reaction, but times are optional", async () => {
    renderDialog({ kind: "missing" });

    expect(screen.getByRole("heading", { name: "Missing reaction" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Starts at" })).toHaveValue("");
    expect(screen.getByRole("button", { name: "Send report" })).toBeDisabled();

    fireEvent.change(screen.getByRole("textbox", { name: /What did KOL react to/ }), { target: { value: "   " } });
    expect(screen.getByRole("button", { name: "Send report" })).toBeDisabled();

    fireEvent.change(screen.getByRole("textbox", { name: /What did KOL react to/ }), { target: { value: "One Piece 1100" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Starts at" }), { target: { value: "10" } });
    send();

    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("reports.create", {
      report: { kind: "missing", postId: "post-1001", postTitle: "Anime Tonight", tagId: undefined, tagTitle: undefined, note: "One Piece 1100", startTime: 10, endTime: undefined },
    }));
  });

  it("does not name a reaction in a report about the post", async () => {
    renderDialog({ kind: "missing", tag });

    fireEvent.change(screen.getByRole("textbox", { name: /What did KOL react to/ }), { target: { value: "One Piece" } });
    send();

    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("reports.create", {
      report: expect.objectContaining({ kind: "missing", tagId: undefined, tagTitle: "Ep 4 — Ep 4" }),
    }));
  });

  it("cannot send times that end before they start", () => {
    renderDialog({ kind: "timestamp", tag });

    fireEvent.change(screen.getByRole("textbox", { name: "Ends at" }), { target: { value: "0:01:00" } });

    expect(screen.getByRole("alert")).toHaveTextContent("Must be after the start");
    expect(screen.getByRole("button", { name: "Send report" })).toBeDisabled();

    fireEvent.change(screen.getByRole("textbox", { name: "Ends at" }), { target: { value: "0:01:01" } });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send report" })).toBeEnabled();
  });

  it("limits the note to 500 characters, and counts them", () => {
    renderDialog({ kind: "untracked" });

    fireEvent.change(screen.getByRole("textbox", { name: "Note" }), { target: { value: "a".repeat(600) } });

    expect(screen.getByRole("textbox", { name: "Note" })).toHaveValue("a".repeat(500));
    expect(screen.getByText("500/500")).toBeInTheDocument();
  });

  it("counts the note from zero", () => {
    renderDialog({ kind: "untracked" });

    expect(screen.getByText("0/500")).toBeInTheDocument();
  });

  it("shortens long titles to what a report holds", async () => {
    renderDialog({ kind: "timestamp", tag, post: { id: "post-1001", title: "T".repeat(400) } });
    send();

    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("reports.create", { report: expect.objectContaining({ postTitle: "T".repeat(300) }) }));
  });

  it("is disabled while sending", async () => {
    let finish: () => void = () => undefined;

    requestMock.mockImplementation((() => new Promise<null>((resolve) => {
      finish = () => resolve(null);
    })) as never);
    renderDialog({ kind: "untracked" });
    send();

    await waitFor(() => expect(screen.getByRole("button", { name: "Send report" })).toBeDisabled());
    expect(screen.getByRole("textbox", { name: "Note" })).toBeDisabled();

    finish();

    expect(await screen.findByText("Thanks! A moderator will look at it.")).toBeInTheDocument();
  });

  it("shows why a report was refused, and can be sent again", async () => {
    requestMock.mockRejectedValueOnce(new Error("You already reported this."));
    renderDialog({ kind: "untracked" });
    send();

    expect(await screen.findByRole("alert")).toHaveTextContent("You already reported this.");
    expect(screen.getByRole("button", { name: "Send report" })).toBeEnabled();

    send();

    expect(await screen.findByText("Thanks! A moderator will look at it.")).toBeInTheDocument();
    expect(screen.queryByText("You already reported this.")).not.toBeInTheDocument();
  });

  it("closes when cancelled", () => {
    const onClose = vi.fn();

    renderDialog({ kind: "untracked", onClose });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(requestMock).not.toHaveBeenCalled();
  });

  it("closes when dismissed", async () => {
    const onClose = vi.fn();

    renderDialog({ kind: "untracked", onClose });
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });

  it("starts over each time it opens", async () => {
    const rerender = renderDialog({ kind: "timestamp", tag });

    fireEvent.click(screen.getByRole("radio", { name: /Wrong show or episode/ }));
    fireEvent.change(screen.getByRole("textbox", { name: /What is it really/ }), { target: { value: "Episode 5" } });
    send();
    await screen.findByText("Thanks! A moderator will look at it.");
    rerender(false);
    rerender(true);

    expect(screen.getByRole("radio", { name: /Wrong timestamp/ })).toBeChecked();
    expect(screen.getByRole("textbox", { name: "Note" })).toHaveValue("");
    expect(screen.getByRole("textbox", { name: "Starts at" })).toHaveValue("0:01:00");
    expect(screen.queryByText("Thanks! A moderator will look at it.")).not.toBeInTheDocument();
  });

  it("clears an earlier refusal when it opens again", async () => {
    requestMock.mockRejectedValueOnce(new Error("Offline"));

    const rerender = renderDialog({ kind: "untracked" });

    send();
    await screen.findByText("Offline");
    rerender(false);
    rerender(true);

    expect(screen.queryByText("Offline")).not.toBeInTheDocument();
  });

  it("starts without times when no reaction is reported", () => {
    renderDialog({ kind: "missing" });

    expect(screen.getByRole("textbox", { name: "Ends at" })).toHaveValue("");
  });
});
