import { fireEvent, render, screen } from "@testing-library/react";
import { ModerationContext } from "../../../../context/ModerationContext";
import { PostContext } from "../../../../context/PostContext";
import { useAuthStore } from "../../../../state/auth.state";
import { useReportsStore } from "../../../../state/reports.state";
import PostModeration from "./PostModeration";



const user = { uid: "u1", email: null, displayName: null, photoURL: null };
const actions = { report: vi.fn(), editTag: vi.fn(), deleteTag: vi.fn(), editPost: vi.fn(), untrackPost: vi.fn(), review: vi.fn() };

function report(id: string, postId: string, tagId?: string) {
  return { id, kind: tagId ? "timestamp" : "missing", postId, tagId, postTitle: "", note: "", reporterUid: "u2", reporterName: "", createdAt: 1 } as const;
}

function renderControls() {
  return render(
    <PostContext.Provider value={{ post: { id: "anime-tonight-1001", tags: [] } as never }}>
      <ModerationContext.Provider value={actions}>
        <PostModeration />
      </ModerationContext.Provider>
    </PostContext.Provider>,
  );
}

describe("postModeration", () => {
  beforeEach(() => {
    Object.values(actions).forEach(action => action.mockClear());
    useReportsStore.setState({ reports: [report("a", "1001", "t1"), report("b", "anime-tonight-1001"), report("c", "2002")] });
  });

  it("shows nothing to signed-out viewers", () => {
    useAuthStore.setState({ user: null, moderator: false });

    expect(renderControls().container).toBeEmptyDOMElement();
  });

  it("lets viewers report a missing reaction, without moderator tools", () => {
    useAuthStore.setState({ user, moderator: false });
    renderControls();

    fireEvent.click(screen.getByRole("button", { name: "report a missing reaction" }));

    expect(actions.report).toHaveBeenCalledWith("missing");
    expect(screen.queryByRole("button", { name: "moderate" })).not.toBeInTheDocument();
  });

  it("gives moderators the post's report count and tools", () => {
    useAuthStore.setState({ user, moderator: true });
    renderControls();

    expect(screen.getByText("2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "moderate" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Review post reports (1)" }));

    expect(actions.review).toHaveBeenCalledWith();
  });
});
