import { act, render, screen } from "@testing-library/react";
import { PostContext } from "../../../../context/PostContext";
import { ReactionOverlayContext } from "../../../../context/ReactionOverlayContext";
import { Tag } from "../../../../core/domain/tag";
import { useAuthStore } from "../../../../state/auth.state";
import { useWatchlistStore } from "../../../../state/watchlist.state";
import PostReaction from "./PostReaction";



function tag(id: string): Tag {
  return new Tag({ id, entryId: "e1", label: id, description: "", startTime: 0, endTime: 60, context: {} }, null);
}

function renderRow(postId: string, tagId: string) {
  const overlay = { setAnchorOpened: vi.fn(), setAnchorEl: vi.fn(), setTag: vi.fn(), setDialogOpened: vi.fn() };

  return render(
    <PostContext.Provider value={{ post: { id: postId } as never }}>
      <ReactionOverlayContext.Provider value={overlay as never}>
        <ul><PostReaction tag={tag(tagId)} /></ul>
      </ReactionOverlayContext.Provider>
    </PostContext.Provider>,
  );
}

describe("watched checkbox while saving", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: { uid: "u1", email: null, displayName: null, photoURL: null } });
    useWatchlistStore.setState({ posts: new Map([["p1", new Set(["t3"])]]), saving: new Map() });
  });

  it("shows a loader for the reaction being saved and locks the rest of the post", () => {
    renderRow("p1", "t1");
    expect(screen.getByRole("checkbox")).toBeEnabled();

    act(() => useWatchlistStore.setState({ saving: new Map([["p1", "t1"]]) }));
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("locks the other reactions of that post, but not other posts", () => {
    const first = renderRow("p1", "t2");
    const other = renderRow("p2", "t1");

    act(() => useWatchlistStore.setState({ saving: new Map([["p1", "t1"]]) }));

    const [locked, free] = screen.getAllByRole("checkbox");

    expect(locked).toBeDisabled();
    expect(free).toBeEnabled();
    first.unmount();
    other.unmount();
  });

  it("shows the stored state of its own post", () => {
    renderRow("p1", "t3");

    expect(screen.getByRole("checkbox")).toBeChecked();
  });
});
