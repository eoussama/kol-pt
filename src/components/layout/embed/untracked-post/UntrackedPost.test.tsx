import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { request } from "../../../../core/messaging/client";
import { useAuthStore } from "../../../../state/auth.state";
import { useReportsStore } from "../../../../state/reports.state";
import UntrackedPost from "./UntrackedPost";



vi.mock("../../../../core/messaging/client", () => ({ request: vi.fn() }));

const requestMock = vi.mocked(request);
const user = { uid: "u1", email: null, displayName: null, photoURL: null };
const published = new Date(2024, 0, 15, 13, 45).getTime();

/**
 * @description
 * Builds an open report.
 *
 * @param id - The report id
 * @param postId - The post it is about
 * @param tagId - The reaction it is about, if any
 * @returns The report
 */
function report(id: string, postId: string, tagId?: string) {
  return { id, kind: "untracked", postId, tagId, postTitle: "", note: "", reporterUid: "u2", reporterName: "", createdAt: 1 } as const;
}

/**
 * @description
 * Builds a Patreon post card, as the page shows it.
 *
 * @returns The card
 */
function createCard(): HTMLElement {
  const card = document.createElement("div");

  card.innerHTML = "<div data-tag=\"post-title\"><a href=\"/posts/anime-tonight-1001\">Anime   Tonight</a></div>";

  return card;
}

/**
 * @description
 * Renders the bar under a post.
 *
 * @returns The render result
 */
function renderBar() {
  return render(<UntrackedPost card={createCard()} postId="1001" />);
}

/**
 * @description
 * Makes the details Patreon gives for a post arrive when asked for.
 *
 * @param details - What to answer, or an error to fail with
 */
function answerDetails(details: { publishedAt: number | null; thumbnail: string | null } | Error): void {
  requestMock.mockImplementation((async (type: string) => {
    if (type === "posts.details") {
      if (details instanceof Error) {
        throw details;
      }

      return details;
    }

    return null;
  }) as never);
}

describe("untrackedPost", () => {
  beforeEach(() => {
    requestMock.mockReset();
    requestMock.mockResolvedValue(null as never);
    useAuthStore.setState({ user, moderator: false });
    useReportsStore.setState({ reports: [] });
  });

  it("shows nothing to signed-out viewers", () => {
    useAuthStore.setState({ user: null });

    expect(renderBar().container).toBeEmptyDOMElement();
  });

  describe("for viewers", () => {
    it("says the post is not tracked and offers to ask for it", () => {
      renderBar();

      expect(screen.getByText("KOL PT does not track this post yet.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Ask to track" })).toBeEnabled();
      expect(screen.queryByRole("button", { name: "Track post" })).not.toBeInTheDocument();
    });

    it("sends the request to track, with the post as the card shows it", async () => {
      renderBar();

      fireEvent.click(screen.getByRole("button", { name: "Ask to track" }));

      const dialog = await screen.findByRole("dialog");

      expect(dialog).toHaveTextContent("Track this post");

      fireEvent.click(within(dialog).getByRole("button", { name: "Send report" }));

      await waitFor(() => expect(requestMock).toHaveBeenCalledWith("reports.create", {
        report: expect.objectContaining({ kind: "untracked", postId: "anime-tonight-1001", postTitle: "Anime Tonight" }),
      }));
      expect(requestMock).not.toHaveBeenCalledWith("posts.details", expect.anything());
    });

    it("closes the request form without sending anything", async () => {
      renderBar();

      fireEvent.click(screen.getByRole("button", { name: "Ask to track" }));
      fireEvent.keyDown(await screen.findByRole("dialog"), { key: "Escape" });

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(requestMock).not.toHaveBeenCalled();
    });

    it("does not show the requests to track, even when there are some", () => {
      useReportsStore.setState({ reports: [report("a", "1001")] });
      renderBar();

      expect(screen.queryByText(/request/)).not.toBeInTheDocument();
    });
  });

  describe("for moderators", () => {
    beforeEach(() => {
      useAuthStore.setState({ moderator: true });
      answerDetails({ publishedAt: published, thumbnail: "https://cdn.test/thumb.jpg" });
    });

    it("offers to track the post instead of asking", () => {
      renderBar();

      expect(screen.getByRole("button", { name: "Track post" })).toBeEnabled();
      expect(screen.queryByRole("button", { name: "Ask to track" })).not.toBeInTheDocument();
    });

    it("opens the tracking form filled in with what Patreon says about the post", async () => {
      renderBar();

      fireEvent.click(screen.getByRole("button", { name: "Track post" }));

      const dialog = await screen.findByRole("dialog");

      expect(requestMock).toHaveBeenCalledWith("posts.details", { postId: "1001" });
      expect(within(dialog).getByLabelText(/^Title/)).toHaveValue("Anime Tonight");
      expect(within(dialog).getByLabelText("Post ID")).toHaveValue("anime-tonight-1001");
      expect(within(dialog).getByLabelText(/Posted on/)).toHaveValue("2024-01-15T13:45");
      expect(within(dialog).getByLabelText("Thumbnail link")).toHaveValue("https://cdn.test/thumb.jpg");
    });

    it("waits for Patreon, with the button busy meanwhile", async () => {
      let answer: (details: { publishedAt: number | null; thumbnail: string | null }) => void = () => undefined;

      requestMock.mockImplementation((() => new Promise((resolve) => {
        answer = resolve;
      })) as never);

      const { container } = renderBar();

      fireEvent.click(screen.getByRole("button", { name: "Track post" }));

      expect(screen.getByRole("button", { name: "Track post" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Track post" }).querySelector("[data-icon=inline-start]")).not.toBeNull();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      answer({ publishedAt: published, thumbnail: null });

      expect(await screen.findByRole("dialog")).toBeInTheDocument();
      await waitFor(() => expect(within(container).getByRole("button", { name: "Track post", hidden: true })).toBeEnabled());
    });

    it("still opens the form, dated now and without a thumbnail, when Patreon fails", async () => {
      answerDetails(new Error("offline"));

      const before = Date.now();

      renderBar();
      fireEvent.click(screen.getByRole("button", { name: "Track post" }));

      const dialog = await screen.findByRole("dialog");
      const date = new Date((within(dialog).getByLabelText(/Posted on/) as HTMLInputElement).value).getTime();

      expect(date).toBeGreaterThan(before - 120_000);
      expect(date).toBeLessThanOrEqual(Date.now() + 120_000);
      expect(within(dialog).getByLabelText("Thumbnail link")).toHaveValue("");
      expect(within(dialog).getByLabelText(/^Title/)).toHaveValue("Anime Tonight");
    });

    it("forgets what Patreon said before when it fails the next time", async () => {
      renderBar();

      fireEvent.click(screen.getByRole("button", { name: "Track post" }));
      fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Cancel" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

      answerDetails(new Error("offline"));
      fireEvent.click(screen.getByRole("button", { name: "Track post" }));

      const dialog = await screen.findByRole("dialog");

      expect(within(dialog).getByLabelText("Thumbnail link")).toHaveValue("");
      expect(within(dialog).getByLabelText(/Posted on/)).not.toHaveValue("2024-01-15T13:45");
    });

    it("uses no thumbnail and today's date when Patreon knows neither", async () => {
      answerDetails({ publishedAt: null, thumbnail: null });
      renderBar();

      fireEvent.click(screen.getByRole("button", { name: "Track post" }));

      const dialog = await screen.findByRole("dialog");

      expect(within(dialog).getByLabelText("Thumbnail link")).toHaveValue("");
      expect(within(dialog).getByLabelText(/Posted on/)).not.toHaveValue("");
    });

    it("saves the post, closing the requests to track it", async () => {
      useReportsStore.setState({ reports: [report("a", "1001"), report("b", "anime-tonight-1001"), report("c", "2002"), report("d", "1001", "t1")] });
      renderBar();

      fireEvent.click(screen.getByRole("button", { name: "Track post" }));

      const dialog = await screen.findByRole("dialog");

      fireEvent.click(within(dialog).getByRole("button", { name: "Track post" }));

      await waitFor(() => expect(requestMock).toHaveBeenCalledWith("posts.save", {
        post: expect.objectContaining({ id: "anime-tonight-1001", title: "Anime Tonight", creationDate: published, thumbnail: "https://cdn.test/thumb.jpg" }),
      }));
      await waitFor(() => expect(requestMock).toHaveBeenCalledWith("reports.resolve", { reportId: "a" }));
      expect(requestMock).toHaveBeenCalledWith("reports.resolve", { reportId: "b" });
      expect(requestMock).not.toHaveBeenCalledWith("reports.resolve", { reportId: "c" });
      expect(requestMock).not.toHaveBeenCalledWith("reports.resolve", { reportId: "d" });
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("keeps going when a request to track cannot be closed", async () => {
      useReportsStore.setState({ reports: [report("a", "1001"), report("b", "1001")] });
      requestMock.mockImplementation((async (type: string, payload: unknown) => {
        if (type === "posts.details") {
          return { publishedAt: published, thumbnail: null };
        }

        if (type === "reports.resolve" && (payload as { reportId: string }).reportId === "a") {
          throw new Error("gone");
        }

        return null;
      }) as never);
      renderBar();

      fireEvent.click(screen.getByRole("button", { name: "Track post" }));
      fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Track post" }));

      await waitFor(() => expect(requestMock).toHaveBeenCalledWith("reports.resolve", { reportId: "b" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("leaves the requests open when the form is closed without saving", async () => {
      useReportsStore.setState({ reports: [report("a", "1001")] });
      renderBar();

      fireEvent.click(screen.getByRole("button", { name: "Track post" }));
      fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Cancel" }));

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(requestMock).not.toHaveBeenCalledWith("posts.save", expect.anything());
      expect(requestMock).not.toHaveBeenCalledWith("reports.resolve", expect.anything());
    });

    it("counts the requests to track the post, in the singular for one", () => {
      useReportsStore.setState({ reports: [report("a", "1001"), report("c", "2002")] });

      const { unmount } = renderBar();

      expect(screen.getByRole("button", { name: "1 request" })).toBeInTheDocument();
      unmount();

      useReportsStore.setState({ reports: [report("a", "1001"), report("b", "1001"), report("c", "2002")] });
      renderBar();

      expect(screen.getByRole("button", { name: "2 requests" })).toBeInTheDocument();
    });

    it("shows no count without requests", () => {
      useReportsStore.setState({ reports: [report("c", "2002")] });
      renderBar();

      expect(screen.queryByText(/request/)).not.toBeInTheDocument();
    });

    it("reviews the requests, and starts tracking from one", async () => {
      useReportsStore.setState({ reports: [report("a", "1001"), report("b", "1001")] });
      renderBar();

      fireEvent.click(screen.getByRole("button", { name: "2 requests" }));

      const review = await screen.findByRole("dialog");

      expect(review).toHaveTextContent("Requests to track this post");
      expect(within(review).getAllByRole("button", { name: "Fix" })).toHaveLength(2);

      fireEvent.click(within(review).getAllByRole("button", { name: "Fix" })[0]!);

      await waitFor(() => expect(screen.getByRole("dialog")).toHaveTextContent("Track this post"));
      expect(screen.getByLabelText(/^Title/)).toHaveValue("Anime Tonight");
      expect(requestMock).toHaveBeenCalledWith("posts.details", { postId: "1001" });
    });

    it("closes the review of the requests", async () => {
      useReportsStore.setState({ reports: [report("a", "1001")] });
      renderBar();

      fireEvent.click(screen.getByRole("button", { name: "1 request" }));
      fireEvent.keyDown(await screen.findByRole("dialog"), { key: "Escape" });

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });
  });
});
