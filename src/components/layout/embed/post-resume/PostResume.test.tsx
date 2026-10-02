import { fireEvent, render, screen } from "@testing-library/react";
import { PostContext } from "../../../../context/PostContext";
import { Tag } from "../../../../core/domain/tag";
import { useAuthStore } from "../../../../state/auth.state";
import { useProgressStore } from "../../../../state/progress.state";
import PostResume from "./PostResume";



const player = { ready: true, playing: false, currentTime: 0, playFrom: vi.fn() };

vi.mock("../../../../content/player/PlayerProvider", () => ({ usePlayer: () => player }));

const post = { id: "p1", tags: [new Tag({ id: "a", entryId: "e1", label: "Opening", description: "", startTime: 100, endTime: 200, context: {} }, null)] };

function renderResume() {
  return render(
    <PostContext.Provider value={{ post: post as never }}>
      <PostResume />
    </PostContext.Provider>,
  );
}

describe("postResume", () => {
  beforeEach(() => {
    Object.assign(player, { ready: true, playing: false, currentTime: 0 });
    player.playFrom.mockClear();
    useAuthStore.setState({ user: { uid: "u1", email: null, displayName: null, photoURL: null } });
    useProgressStore.setState({ posts: new Map([["p1", { time: 150, updatedAt: 1 }]]) });
  });

  it("offers to resume where the user left off, in which reaction", () => {
    renderResume();

    expect(screen.getByText(/Opening · left off at/)).toBeInTheDocument();
    expect(screen.getByText("0:02:30")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Resume" }));

    expect(player.playFrom).toHaveBeenCalledWith(150);
  });

  it("stays hidden while playing, at the saved position, signed out or with nothing saved", () => {
    player.playing = true;
    expect(renderResume().container).toBeEmptyDOMElement();

    Object.assign(player, { playing: false, currentTime: 148 });
    expect(renderResume().container).toBeEmptyDOMElement();

    player.currentTime = 0;
    useAuthStore.setState({ user: null });
    expect(renderResume().container).toBeEmptyDOMElement();

    useAuthStore.setState({ user: { uid: "u1", email: null, displayName: null, photoURL: null } });
    useProgressStore.setState({ posts: new Map() });
    expect(renderResume().container).toBeEmptyDOMElement();
  });
});
