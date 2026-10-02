import { act, renderHook, waitFor } from "@testing-library/react";
import { browser } from "wxt/browser";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { useAuth } from "./auth.hook";



describe("useAuth", () => {
  beforeEach(() => {
    fakeBrowser.reset();
    vi.restoreAllMocks();
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
});
