import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PostContext } from "../../../../context/PostContext";
import { ReactionOverlayContext } from "../../../../context/ReactionOverlayContext";
import { useAuthStore } from "../../../../state/auth.state";
import PostReactions from "./PostReactions";



vi.mock("../../../../content/player/PlayerProvider", () => ({
  usePlayer: () => ({ ready: false, playing: false, currentTime: 0, playFrom: vi.fn(), cue: vi.fn() }),
}));
vi.mock("../../../../hooks/auto-watch.hook", () => ({ useAutoWatch: () => undefined }));
vi.mock("../../../../hooks/progress.hook", () => ({ useProgressTracking: () => undefined }));

const user = { uid: "u1", email: null, displayName: null, photoURL: null };

function renderPanel() {
  const overlay = { tag: null, dialogOpened: false, setDialogOpened: vi.fn(), setTag: vi.fn() };

  return render(
    <PostContext.Provider value={{ post: { id: "p1", tags: [] } as never }}>
      <ReactionOverlayContext.Provider value={overlay as never}>
        <PostReactions />
      </ReactionOverlayContext.Provider>
    </PostContext.Provider>,
  );
}

// The callout stays mounted while collapsed, hidden from view and from assistive technologies
const callout = () => screen.getByText(/in order to track your progress/);
const expectShown = () => waitFor(() => expect(callout()).toBeVisible());
const expectHidden = () => waitFor(() => expect(callout()).not.toBeVisible());

describe("empty reactions panel", () => {
  it("stays closed with no toggle", () => {
    renderPanel();

    const summary = screen.getByRole("button", { name: /0 reactions/ });

    expect(summary).toHaveAttribute("aria-expanded", "false");
    expect(summary).toBeDisabled();
    expect(summary.querySelector("svg.lucide-chevron-down")).toBeNull();

    fireEvent.click(summary);
    expect(summary).toHaveAttribute("aria-expanded", "false");
  });
});

describe("login callout", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, ready: false });
  });

  it("stays hidden until the stored sign-in is known, so it never flashes", async () => {
    renderPanel();

    expect(callout()).not.toBeVisible();

    act(() => useAuthStore.getState().setUser(user));
    await expectHidden();
  });

  it("shows for a signed-out user, can be dismissed, and returns after a sign-in and out", async () => {
    renderPanel();
    act(() => useAuthStore.getState().setUser(null));
    await expectShown();

    fireEvent.click(screen.getByRole("button", { name: "Login in notice" }));
    await expectHidden();

    act(() => useAuthStore.getState().setUser(user));
    act(() => useAuthStore.getState().setUser(null));
    await expectShown();
  });

  it("hides once the user signs in", async () => {
    renderPanel();
    act(() => useAuthStore.getState().setUser(null));
    await expectShown();

    act(() => useAuthStore.getState().setUser(user));
    await expectHidden();
  });
});
