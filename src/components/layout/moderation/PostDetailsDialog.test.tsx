import type { IPostDetails } from "./PostDetailsDialog";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { request } from "../../../core/messaging/client";
import PostDetailsDialog, { toLocalInput } from "./PostDetailsDialog";



vi.mock("../../../core/messaging/client", () => ({ request: vi.fn() }));

const requestMock = vi.mocked(request);

const posted = new Date(2024, 0, 15, 13, 45).getTime();
const post: IPostDetails = { id: "anime-tonight-1001", title: "Anime Tonight", description: "Frieren and more", creationDate: posted, thumbnail: "https://example.com/a.jpg" };

/**
 * @description
 * Renders an open post details dialog.
 *
 * @param props - What to override
 * @param props.tracked - Whether the post is tracked already
 * @param props.onClose - Called when the dialog closes
 * @param props.post - The post's details
 * @returns The rerender function
 */
function renderDialog(props: { tracked?: boolean; onClose?: (saved: boolean) => void; post?: IPostDetails } = {}) {
  const onClose = props.onClose ?? vi.fn();
  const element = (open: boolean, details: IPostDetails) => <PostDetailsDialog open={open} tracked={props.tracked ?? true} post={details} onClose={onClose} />;
  const view = render(element(true, props.post ?? post));

  return (open: boolean, details: IPostDetails = props.post ?? post) => view.rerender(element(open, details));
}

describe("toLocalInput", () => {
  it("formats a date for a datetime-local input, in local time", () => {
    expect(toLocalInput(new Date(2024, 0, 15, 13, 45, 59).getTime())).toBe("2024-01-15T13:45");
    expect(toLocalInput(new Date(2024, 11, 5, 0, 7).getTime())).toBe("2024-12-05T00:07");
  });
});

describe("postDetailsDialog", () => {
  beforeEach(() => {
    requestMock.mockReset();
    requestMock.mockResolvedValue(null as never);
  });

  it("edits a tracked post's details", () => {
    renderDialog();

    expect(screen.getByRole("heading", { name: "Edit post details" })).toBeInTheDocument();
    expect(screen.getByText("How the post is listed in the extension.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("starts tracking an untracked post", () => {
    renderDialog({ tracked: false });

    expect(screen.getByRole("heading", { name: "Track this post" })).toBeInTheDocument();
    expect(screen.getByText("Once tracked, add its reactions from the panel under the post.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Track post" })).toBeInTheDocument();
  });

  it("fills the form from the post, and keeps its ID fixed", () => {
    renderDialog();

    expect(screen.getByRole("textbox", { name: "Post ID" })).toHaveValue("anime-tonight-1001");
    expect(screen.getByRole("textbox", { name: "Post ID" })).toBeDisabled();
    expect(screen.getByLabelText(/Posted on/)).toHaveValue("2024-01-15T13:45");
    expect(screen.getByRole("textbox", { name: /Title/ })).toHaveValue("Anime Tonight");
    expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue("Frieren and more");
    expect(screen.getByRole("textbox", { name: "Thumbnail link" })).toHaveValue("https://example.com/a.jpg");
  });

  it("marks the date and the title as required", () => {
    renderDialog();

    expect(screen.getByLabelText(/Posted on/)).toBeRequired();
    expect(screen.getByRole("textbox", { name: /Title/ })).toBeRequired();
    expect(screen.getByRole("textbox", { name: "Description" })).not.toBeRequired();
  });

  it("saves what was typed, and closes as saved", async () => {
    const onClose = vi.fn();

    renderDialog({ onClose });
    fireEvent.change(screen.getByRole("textbox", { name: /Title/ }), { target: { value: "Movie Night" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), { target: { value: "A movie" } });
    fireEvent.change(screen.getByLabelText(/Posted on/), { target: { value: "2024-02-20T08:30" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Thumbnail link" }), { target: { value: "  https://example.com/b.jpg  " } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onClose).toHaveBeenCalledExactlyOnceWith(true));
    expect(requestMock).toHaveBeenCalledExactlyOnceWith("posts.save", {
      post: { id: "anime-tonight-1001", title: "Movie Night", description: "A movie", creationDate: new Date(2024, 1, 20, 8, 30).getTime(), thumbnail: "https://example.com/b.jpg" },
    });
  });

  it("accepts a post without a thumbnail", async () => {
    const onClose = vi.fn();

    renderDialog({ onClose, post: { ...post, thumbnail: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onClose).toHaveBeenCalledExactlyOnceWith(true));
    expect(requestMock).toHaveBeenCalledWith("posts.save", { post: expect.objectContaining({ thumbnail: "" }) });
  });

  it("asks for a title under the field, without saving", async () => {
    renderDialog();

    fireEvent.change(screen.getByRole("textbox", { name: /Title/ }), { target: { value: "  " } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect((await screen.findByRole("alert")).closest("[data-slot=field]")).toHaveTextContent("Title");
    expect(screen.getByRole("alert")).toHaveTextContent("Give the post a title");
    expect(screen.getByRole("textbox", { name: /Title/ })).toHaveAttribute("aria-invalid", "true");
    expect(requestMock).not.toHaveBeenCalled();
  });

  it("asks for a date under the field, without saving", async () => {
    renderDialog();

    fireEvent.change(screen.getByLabelText(/Posted on/), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Pick the date it was posted");
    expect(screen.getByRole("alert").closest("[data-slot=field]")).toHaveTextContent("Posted on");
    expect(screen.getByLabelText(/Posted on/)).toHaveAttribute("aria-invalid", "true");
    expect(requestMock).not.toHaveBeenCalled();
  });

  it("asks for an https thumbnail under the field, without saving", async () => {
    renderDialog();

    fireEvent.change(screen.getByRole("textbox", { name: "Thumbnail link" }), { target: { value: "http://example.com/a.jpg" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The thumbnail must be an https link");
    expect(screen.getByRole("alert").closest("[data-slot=field]")).toHaveTextContent("Thumbnail link");
    expect(requestMock).not.toHaveBeenCalled();
  });

  it("is disabled while saving", async () => {
    let finish: () => void = () => undefined;

    requestMock.mockImplementation((() => new Promise<null>((resolve) => {
      finish = () => resolve(null);
    })) as never);
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Save" })).toBeDisabled());
    expect(screen.getByRole("textbox", { name: /Title/ })).toBeDisabled();

    finish();

    await waitFor(() => expect(screen.getByRole("button", { name: "Save" })).toBeEnabled());
  });

  it("shows why saving failed under the form, and stays open", async () => {
    const onClose = vi.fn();

    requestMock.mockRejectedValueOnce(new Error("Missing or insufficient permissions."));
    renderDialog({ onClose });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The database refused this change");
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("clears a failure when saving again", async () => {
    requestMock.mockRejectedValueOnce(new Error("Offline"));
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Offline");

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(screen.queryByText("Offline")).not.toBeInTheDocument());
  });

  it("closes as not saved when cancelled", () => {
    const onClose = vi.fn();

    renderDialog({ onClose });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledExactlyOnceWith(false);
    expect(requestMock).not.toHaveBeenCalled();
  });

  it("closes as not saved when dismissed", async () => {
    const onClose = vi.fn();

    renderDialog({ onClose });
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    await waitFor(() => expect(onClose).toHaveBeenCalledWith(false));
  });

  it("starts over from the post each time it opens, without an earlier problem", async () => {
    const rerender = renderDialog();

    fireEvent.change(screen.getByRole("textbox", { name: /Title/ }), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByRole("alert");
    rerender(false);
    rerender(true);

    expect(screen.getByRole("textbox", { name: /Title/ })).toHaveValue("Anime Tonight");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("follows the post it is given while open", () => {
    const rerender = renderDialog();

    rerender(true, { ...post, title: "Updated", description: "New", creationDate: new Date(2025, 5, 1, 9, 0).getTime(), thumbnail: "" });

    expect(screen.getByRole("textbox", { name: /Title/ })).toHaveValue("Updated");
    expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue("New");
    expect(screen.getByLabelText(/Posted on/)).toHaveValue("2025-06-01T09:00");
    expect(screen.getByRole("textbox", { name: "Thumbnail link" })).toHaveValue("");
  });
});
