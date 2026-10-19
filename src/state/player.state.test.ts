import { usePlayerStore } from "./player.state";



describe("player store", () => {
  beforeEach(() => {
    usePlayerStore.setState({ playerPostId: null });
  });

  it("starts with nothing playing", () => {
    expect(usePlayerStore.getInitialState().playerPostId).toBeNull();
  });

  it("remembers the post playing, and replaces it when another starts", () => {
    usePlayerStore.getState().play("p1");
    expect(usePlayerStore.getState().playerPostId).toBe("p1");

    usePlayerStore.getState().play("p2");
    expect(usePlayerStore.getState().playerPostId).toBe("p2");
  });

  it("forgets the post when paused", () => {
    usePlayerStore.getState().play("p1");
    usePlayerStore.getState().pause();

    expect(usePlayerStore.getState().playerPostId).toBeNull();
  });
});
