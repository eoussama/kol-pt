import { act, renderHook, waitFor } from "@testing-library/react";
import { EViewMode } from "../core/enums/view-mode.enum";
import { request } from "../core/messaging/client";
import { useAuthStore } from "../state/auth.state";
import { useSettingsStore } from "../state/settings.state";
import { useViewMode } from "./view-mode.hook";



vi.mock("../core/messaging/client", () => ({ request: vi.fn() }));

const requestMock = vi.mocked(request);
const user = { uid: "u1", email: null, displayName: null, photoURL: null };

describe("useViewMode", () => {
  beforeEach(() => {
    requestMock.mockReset();
    requestMock.mockResolvedValue({ viewMode: EViewMode.COMPACT });
    useSettingsStore.setState({ viewMode: EViewMode.EXPANDED });
    useAuthStore.setState({ user: null });
  });

  it("highlights the active view mode", () => {
    const { result } = renderHook(() => useViewMode());

    expect(result.current.viewMode).toBe(EViewMode.EXPANDED);
    expect(result.current.expandedViewColor).toBe("primary");
    expect(result.current.compactViewColor).toBe("default");

    act(() => result.current.setViewMode(EViewMode.COMPACT));

    expect(result.current.viewMode).toBe(EViewMode.COMPACT);
    expect(result.current.compactViewColor).toBe("primary");
    expect(result.current.expandedViewColor).toBe("default");
  });

  it("does not look for saved settings when signed out", () => {
    renderHook(() => useViewMode());

    expect(requestMock).not.toHaveBeenCalled();
  });

  it("applies the signed-in user's saved view mode, without saving it back", async () => {
    useAuthStore.setState({ user });

    const { result } = renderHook(() => useViewMode());

    await waitFor(() => expect(result.current.viewMode).toBe(EViewMode.COMPACT));
    expect(requestMock).toHaveBeenCalledExactlyOnceWith("settings.get", {});
  });

  it("loads the settings again when another user signs in", async () => {
    useAuthStore.setState({ user });
    renderHook(() => useViewMode());
    await waitFor(() => expect(requestMock).toHaveBeenCalledTimes(1));

    act(() => useAuthStore.setState({ user: { ...user, displayName: "Renamed" } }));
    expect(requestMock).toHaveBeenCalledTimes(1);

    act(() => useAuthStore.setState({ user: { ...user, uid: "u2" } }));
    await waitFor(() => expect(requestMock).toHaveBeenCalledTimes(2));
  });

  it("keeps the current view mode when the settings cannot be loaded", async () => {
    useAuthStore.setState({ user });
    requestMock.mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => useViewMode());

    await waitFor(() => expect(requestMock).toHaveBeenCalled());
    await Promise.resolve();
    expect(result.current.viewMode).toBe(EViewMode.EXPANDED);
  });
});
