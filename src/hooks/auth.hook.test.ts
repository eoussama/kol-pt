import { act, renderHook, waitFor } from "@testing-library/react";
import { browser } from "wxt/browser";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { request } from "../core/messaging/client";
import { useAuthStore } from "../state/auth.state";
import { useAuth } from "./auth.hook";



vi.mock("../core/messaging/client", () => ({ request: vi.fn(async () => null) }));



describe("useAuth", () => {
  beforeEach(() => {
    fakeBrowser.reset();
    vi.restoreAllMocks();
    vi.mocked(request).mockClear();
    useAuthStore.setState({ user: null });
  });

  it("opens the login page in a window of its own", async () => {
    const create = vi.spyOn(browser.windows, "create").mockResolvedValue({} as never);
    const { result } = renderHook(() => useAuth());

    act(() => result.current.onLogin());

    await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({
      type: "popup",
      url: browser.runtime.getURL("/auth.html" as never),
    })));
  });

  it("falls back to a tab where windows are not available", async () => {
    vi.spyOn(browser.windows, "create").mockRejectedValue(new Error("not supported"));

    const createTab = vi.spyOn(browser.tabs, "create").mockResolvedValue({} as never);
    const { result } = renderHook(() => useAuth());

    act(() => result.current.onLogin());

    await waitFor(() => expect(createTab).toHaveBeenCalledWith({ url: browser.runtime.getURL("/auth.html" as never) }));
  });

  it("does not fail when no tab can be opened either", async () => {
    vi.spyOn(browser.windows, "create").mockRejectedValue(new Error("not supported"));

    const createTab = vi.spyOn(browser.tabs, "create").mockRejectedValue(new Error("blocked"));
    const { result } = renderHook(() => useAuth());

    act(() => result.current.onLogin());

    await waitFor(() => expect(createTab).toHaveBeenCalled());
  });

  it("signs out through the background", () => {
    const { result } = renderHook(() => useAuth());

    act(() => result.current.onLogout());

    expect(request).toHaveBeenCalledExactlyOnceWith("auth.signOut", {});
  });

  it("does not fail when signing out does", async () => {
    vi.mocked(request).mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => useAuth());

    act(() => result.current.onLogout());

    await waitFor(() => expect(request).toHaveBeenCalled());
  });

  it("is signed out with the default picture and no email when nobody is signed in", () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoggedIn()).toBe(false);
    expect(result.current.email).toBe("");
    expect(result.current.photo).toBe("./icons/icon128x128.png");
  });

  it("shows the signed-in user's email and picture", () => {
    useAuthStore.setState({ user: { uid: "u1", email: "a@b.c", displayName: "A", photoURL: "https://example.com/a.png" } });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoggedIn()).toBe(true);
    expect(result.current.email).toBe("a@b.c");
    expect(result.current.photo).toBe("https://example.com/a.png");
  });

  it("falls back to the default picture and no email for users without them", () => {
    useAuthStore.setState({ user: { uid: "u1", email: null, displayName: null, photoURL: null } });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoggedIn()).toBe(true);
    expect(result.current.email).toBe("");
    expect(result.current.photo).toBe("./icons/icon128x128.png");
  });
});
