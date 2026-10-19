import type { IAuthUser } from "../core/types/auth-user.type";

import { useAuthStore } from "./auth.state";



const user: IAuthUser = { uid: "u1", email: "a@b.c", displayName: "A", photoURL: null };

describe("auth store", () => {
  beforeEach(() => {
    useAuthStore.setState(useAuthStore.getInitialState());
  });

  it("starts signed out and not ready", () => {
    const { user: current, ready, moderator } = useAuthStore.getState();

    expect(current).toBeNull();
    expect(ready).toBe(false);
    expect(moderator).toBe(false);
  });

  it("is ready once the user is known, even when nobody is signed in", () => {
    useAuthStore.getState().setUser(user);
    expect(useAuthStore.getState()).toMatchObject({ user, ready: true });

    useAuthStore.getState().setUser(null);
    expect(useAuthStore.getState()).toMatchObject({ user: null, ready: true });
  });

  it("tracks whether the user is a moderator, without touching the user", () => {
    useAuthStore.getState().setUser(user);
    useAuthStore.getState().setModerator(true);
    expect(useAuthStore.getState()).toMatchObject({ user, moderator: true });

    useAuthStore.getState().setModerator(false);
    expect(useAuthStore.getState().moderator).toBe(false);
  });
});
