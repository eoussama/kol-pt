import type { TReport } from "../../../core/schemas/moderation.schema";

import { fireEvent, render, screen } from "@testing-library/react";
import { ModerationContext } from "../../../context/ModerationContext";
import { Post } from "../../../core/domain/post";
import { Tag } from "../../../core/domain/tag";
import { useReportsStore } from "../../../state/reports.state";
import PostModerationMenu from "./PostModerationMenu";



const tags = [
  new Tag({ id: "t2", entryId: "e1", label: "Ep 9", description: "", startTime: 300, endTime: 400, context: {} }, null),
  new Tag({ id: "t1", entryId: "e1", label: "Ep 4", description: "", startTime: 60, endTime: 120, context: {} }, null),
];
const post = new Post({ id: "anime-tonight-1001", title: "Anime Tonight", description: "", creationDate: 0, thumbnail: "", tags: [] }, tags);

const actions = { report: vi.fn(), editTag: vi.fn(), deleteTag: vi.fn(), editPost: vi.fn(), untrackPost: vi.fn(), review: vi.fn() };

/**
 * @description
 * Builds a report.
 *
 * @param id - The report's ID
 * @param postId - The post it is about
 * @param tagId - The reaction it is about, if any
 * @returns The report
 */
function reportAbout(id: string, postId: string, tagId?: string): TReport {
  return { id, kind: tagId ? "timestamp" : "untracked", postId, tagId, postTitle: "", note: "", reporterUid: "u1", reporterName: "", createdAt: 0 };
}

/**
 * @description
 * Renders the menu for the post and opens it.
 *
 * @param props - What to pass the menu
 * @param props.listReactions - Whether the menu lists the reactions to edit
 * @param props.className - Extra classes for the trigger
 */
function openMenu(props: { listReactions?: boolean; className?: string } = {}): void {
  render(
    <ModerationContext.Provider value={actions}>
      <PostModerationMenu post={post} {...props} />
    </ModerationContext.Provider>,
  );

  fireEvent.click(screen.getByRole("button", { name: "moderate" }));
}

describe("postModerationMenu", () => {
  beforeEach(() => {
    Object.values(actions).forEach(action => action.mockClear());
    useReportsStore.setState({ reports: [] });
  });

  it("adds a reaction", async () => {
    openMenu();

    fireEvent.click(await screen.findByRole("menuitem", { name: "Add a reaction" }));

    expect(actions.editTag).toHaveBeenCalledExactlyOnceWith(null);
  });

  it("edits the post's details", async () => {
    openMenu();

    fireEvent.click(await screen.findByRole("menuitem", { name: "Edit post details" }));

    expect(actions.editPost).toHaveBeenCalledOnce();
  });

  it("stops tracking the post", async () => {
    openMenu();

    fireEvent.click(await screen.findByRole("menuitem", { name: "Stop tracking this post" }));

    expect(actions.untrackPost).toHaveBeenCalledOnce();
  });

  it("offers neither reactions to edit nor reports to review by default", async () => {
    openMenu();

    await screen.findByRole("menuitem", { name: "Add a reaction" });

    expect(screen.queryByRole("menuitem", { name: /Edit a reaction/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /Review post reports/ })).not.toBeInTheDocument();
  });

  it("lists the post's reactions to edit, by start time", async () => {
    openMenu({ listReactions: true });

    fireEvent.click(await screen.findByRole("menuitem", { name: "Edit a reaction" }));
    const first = await screen.findByRole("menuitem", { name: /Ep 4/ });
    const second = screen.getByRole("menuitem", { name: /Ep 9/ });

    expect(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(second);

    expect(actions.editTag).toHaveBeenCalledExactlyOnceWith(tags[0]);
  });

  it("does not offer to edit reactions on a post without any", async () => {
    render(
      <ModerationContext.Provider value={actions}>
        <PostModerationMenu post={new Post({ id: "p2", title: "Empty", description: "", creationDate: 0, thumbnail: "", tags: [] }, [])} listReactions />
      </ModerationContext.Provider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "moderate" }));

    await screen.findByRole("menuitem", { name: "Add a reaction" });

    expect(screen.queryByRole("menuitem", { name: "Edit a reaction" })).not.toBeInTheDocument();
  });

  it("reviews the reports about the post itself", async () => {
    useReportsStore.setState({ reports: [reportAbout("r1", "1001"), reportAbout("r2", "1001", "t1"), reportAbout("r3", "2002")] });
    openMenu();

    fireEvent.click(await screen.findByRole("menuitem", { name: "Review post reports (1)" }));

    expect(actions.review).toHaveBeenCalledExactlyOnceWith();
  });

  it("badges the trigger with every open report on the post", async () => {
    useReportsStore.setState({ reports: [reportAbout("r1", "1001"), reportAbout("r2", "1001", "t1"), reportAbout("r3", "2002")] });
    openMenu();

    expect(screen.getByRole("button", { name: "moderate" })).toHaveTextContent("2");
  });

  it("does not badge the trigger without reports", () => {
    openMenu();

    expect(screen.getByRole("button", { name: "moderate" })).toHaveTextContent("");
  });

  it("caps the badge at 99+", () => {
    useReportsStore.setState({ reports: Array.from({ length: 100 }, (_, index) => reportAbout(`r${index}`, "1001", "t1")) });
    openMenu();

    expect(screen.getByRole("button", { name: "moderate" })).toHaveTextContent("99+");
  });

  it("shows the exact count at 99", () => {
    useReportsStore.setState({ reports: Array.from({ length: 99 }, (_, index) => reportAbout(`r${index}`, "1001", "t1")) });
    openMenu();

    expect(screen.getByRole("button", { name: "moderate" })).toHaveTextContent("99");
    expect(screen.getByRole("button", { name: "moderate" })).not.toHaveTextContent("99+");
  });

  it("adds extra classes to the trigger", () => {
    openMenu({ className: "extra-class" });

    expect(screen.getByRole("button", { name: "moderate" })).toHaveClass("extra-class");
  });

  it("names the open reports in the tooltip", async () => {
    useReportsStore.setState({ reports: [reportAbout("r1", "1001", "t1")] });
    openMenu();
    fireEvent.focus(screen.getByRole("button", { name: "moderate" }));
    fireEvent.mouseEnter(screen.getByRole("button", { name: "moderate" }));

    expect(await screen.findByText("Moderate (1 open reports)")).toBeInTheDocument();
  });
});
