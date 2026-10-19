import type { IAuthUser } from "../core/types/auth-user.type";

import { renderHook, waitFor } from "@testing-library/react";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { authUserItem, moderatorItem } from "../core/storage/items";
import { useAuthStore } from "../state/auth.state";
import { useAuthSync } from "./auth-sync.hook";



const user: IAuthUser = { uid: "u1", email: "a@b.c", displayName: "A", photoURL: null };

/**
 * @description
 * A promise settled from outside.
 *
 * @returns The promise and how to settle it
 */
function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe("useAuthSync", () => {
  beforeEach(async () => {
    fakeBrowser.reset();
    vi.restoreAllMocks();
    useAuthStore.setState(useAuthStore.getInitialState());
    await authUserItem.removeValue();
    await moderatorItem.removeValue();
  });

  it("is ready, with nobody signed in, when storage has no user", async () => {
    renderHook(() => useAuthSync());

    await waitFor(() => expect(useAuthStore.getState().ready).toBe(true));
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("signs in the user kept in storage", async () => {
    await authUserItem.setValue(user);

    renderHook(() => useAuthSync());

    await waitFor(() => expect(useAuthStore.getState().user).toEqual(user));
    expect(useAuthStore.getState().ready).toBe(true);
  });

  it("follows the user as storage changes, signing out included", async () => {
    renderHook(() => useAuthSync());
    await waitFor(() => expect(useAuthStore.getState().ready).toBe(true));

    await authUserItem.setValue(user);
    await waitFor(() => expect(useAuthStore.getState().user).toEqual(user));

    await authUserItem.setValue(null);
    await waitFor(() => expect(useAuthStore.getState().user).toBeNull());
  });

  it("ignores the stored user once unmounted", async () => {
    const read = deferred<IAuthUser | null>();

    vi.spyOn(authUserItem, "getValue").mockReturnValue(read.promise);

    const { unmount } = renderHook(() => useAuthSync());

    unmount();
    read.resolve(user);
    await read.promise;

    expect(useAuthStore.getState()).toMatchObject({ user: null, ready: false });
  });

  it("stops following storage once unmounted", async () => {
    const { unmount } = renderHook(() => useAuthSync());

    await waitFor(() => expect(useAuthStore.getState().ready).toBe(true));
    unmount();

    await authUserItem.setValue(user);
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(useAuthStore.getState().user).toBeNull();
  });

  it("settles on the user already known when storage cannot be read", async () => {
    useAuthStore.setState({ user });
    vi.spyOn(authUserItem, "getValue").mockRejectedValue(new Error("unreadable"));

    renderHook(() => useAuthSync());

    await waitFor(() => expect(useAuthStore.getState().ready).toBe(true));
    expect(useAuthStore.getState().user).toEqual(user);
  });

  it("does not settle when storage cannot be read after unmounting", async () => {
    const read = deferred<IAuthUser | null>();

    vi.spyOn(authUserItem, "getValue").mockReturnValue(read.promise);

    const { unmount } = renderHook(() => useAuthSync());

    unmount();
    read.reject(new Error("unreadable"));
    await read.promise.catch(() => undefined);

    expect(useAuthStore.getState().ready).toBe(false);
  });
});

describe("useAuthSync moderator", () => {
  beforeEach(async () => {
    fakeBrowser.reset();
    vi.restoreAllMocks();
    useAuthStore.setState(useAuthStore.getInitialState());
    await authUserItem.removeValue();
    await moderatorItem.removeValue();
  });

  it("is not a moderator by default", async () => {
    await authUserItem.setValue(user);
    renderHook(() => useAuthSync());

    await waitFor(() => expect(useAuthStore.getState().user).toEqual(user));
    expect(useAuthStore.getState().moderator).toBe(false);
  });

  it("is a moderator when storage says so for the signed-in user", async () => {
    await authUserItem.setValue(user);
    await moderatorItem.setValue({ uid: "u1", moderator: true });

    renderHook(() => useAuthSync());

    await waitFor(() => expect(useAuthStore.getState().moderator).toBe(true));
  });

  it("is not a moderator when storage says so for someone else", async () => {
    await authUserItem.setValue(user);
    await moderatorItem.setValue({ uid: "u2", moderator: true });

    renderHook(() => useAuthSync());

    await waitFor(() => expect(useAuthStore.getState().user).toEqual(user));
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(useAuthStore.getState().moderator).toBe(false);
  });

  it("is not a moderator when nobody is signed in", async () => {
    await moderatorItem.setValue({ uid: "u1", moderator: true });

    renderHook(() => useAuthSync());

    await waitFor(() => expect(useAuthStore.getState().ready).toBe(true));
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(useAuthStore.getState().moderator).toBe(false);
  });

  it("follows the moderator status as storage changes", async () => {
    await authUserItem.setValue(user);
    renderHook(() => useAuthSync());
    await waitFor(() => expect(useAuthStore.getState().user).toEqual(user));

    await moderatorItem.setValue({ uid: "u1", moderator: true });
    await waitFor(() => expect(useAuthStore.getState().moderator).toBe(true));

    await moderatorItem.setValue({ uid: "u1", moderator: false });
    await waitFor(() => expect(useAuthStore.getState().moderator).toBe(false));
  });

  it("drops the status when the user signs out", async () => {
    await authUserItem.setValue(user);
    await moderatorItem.setValue({ uid: "u1", moderator: true });
    renderHook(() => useAuthSync());
    await waitFor(() => expect(useAuthStore.getState().moderator).toBe(true));

    await authUserItem.setValue(null);
    await waitFor(() => expect(useAuthStore.getState().moderator).toBe(false));
  });

  it("ignores the stored status once unmounted", async () => {
    const read = deferred<{ uid: string; moderator: boolean } | null>();

    vi.spyOn(moderatorItem, "getValue").mockReturnValue(read.promise);
    useAuthStore.setState({ user });

    const { unmount } = renderHook(() => useAuthSync());

    unmount();
    read.resolve({ uid: "u1", moderator: true });
    await read.promise;

    expect(useAuthStore.getState().moderator).toBe(false);
  });

  it("stays as it is when the status cannot be read", async () => {
    await authUserItem.setValue(user);
    vi.spyOn(moderatorItem, "getValue").mockRejectedValue(new Error("unreadable"));

    renderHook(() => useAuthSync());

    await waitFor(() => expect(useAuthStore.getState().user).toEqual(user));
    expect(useAuthStore.getState().moderator).toBe(false);
  });
});
