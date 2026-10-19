import { EViewMode } from "../core/enums/view-mode.enum";
import { request } from "../core/messaging/client";
import { useAuthStore } from "./auth.state";
import { useSettingsStore } from "./settings.state";



vi.mock("../core/messaging/client", () => ({ request: vi.fn() }));

const requestMock = vi.mocked(request);
const signedIn = { uid: "u1", email: null, displayName: null, photoURL: null };

describe("settings store", () => {
  beforeEach(() => {
    requestMock.mockReset();
    requestMock.mockResolvedValue({ viewMode: EViewMode.COMPACT });
    useSettingsStore.setState({ viewMode: EViewMode.EXPANDED });
    useAuthStore.setState({ user: null });
  });

  it("starts expanded", () => {
    expect(useSettingsStore.getInitialState().viewMode).toBe(EViewMode.EXPANDED);
  });

  it("changes the view mode without saving it when signed out", () => {
    useSettingsStore.getState().setViewMode(EViewMode.COMPACT);

    expect(useSettingsStore.getState().viewMode).toBe(EViewMode.COMPACT);
    expect(requestMock).not.toHaveBeenCalled();
  });

  it("saves the view mode for the signed-in user", () => {
    useAuthStore.setState({ user: signedIn });

    useSettingsStore.getState().setViewMode(EViewMode.COMPACT);

    expect(useSettingsStore.getState().viewMode).toBe(EViewMode.COMPACT);
    expect(requestMock).toHaveBeenCalledExactlyOnceWith("settings.set", { settings: { viewMode: EViewMode.COMPACT } });
  });

  it("keeps the view mode when saving it fails", async () => {
    useAuthStore.setState({ user: signedIn });
    requestMock.mockRejectedValue(new Error("offline"));

    useSettingsStore.getState().setViewMode(EViewMode.COMPACT);
    await Promise.resolve();

    expect(useSettingsStore.getState().viewMode).toBe(EViewMode.COMPACT);
  });

  it("applies a loaded view mode without saving it back", () => {
    useAuthStore.setState({ user: signedIn });

    useSettingsStore.getState().applyViewMode(EViewMode.COMPACT);

    expect(useSettingsStore.getState().viewMode).toBe(EViewMode.COMPACT);
    expect(requestMock).not.toHaveBeenCalled();
  });
});
