import { EViewMode } from "../../core/enums/view-mode.enum";
import { readValue, updateValues } from "../database";
import { DEFAULT_SETTINGS, getSettings, updateSettings } from "./settings";



vi.mock("../database", () => ({
  readValue: vi.fn(),
  updateValues: vi.fn(async () => undefined),
}));

describe("settings repository", () => {
  beforeEach(() => {
    vi.mocked(readValue).mockReset();
    vi.mocked(updateValues).mockClear();
  });

  it("gives defaults to users who never changed them", async () => {
    vi.mocked(readValue).mockResolvedValue(null);

    await expect(getSettings("u1")).resolves.toEqual(DEFAULT_SETTINGS);
    expect(readValue).toHaveBeenCalledWith("users/u1/settings");
    expect(DEFAULT_SETTINGS).toEqual({ viewMode: EViewMode.EXPANDED });
  });

  it("reads the saved settings", async () => {
    vi.mocked(readValue).mockResolvedValue({ viewMode: EViewMode.COMPACT });

    await expect(getSettings("u1")).resolves.toEqual({ viewMode: EViewMode.COMPACT });
  });

  it("falls back to defaults for invalid settings", async () => {
    vi.mocked(readValue).mockResolvedValue({ viewMode: 7 });

    await expect(getSettings("u1")).resolves.toEqual(DEFAULT_SETTINGS);
  });

  it("writes the changed settings, then answers with what is stored", async () => {
    vi.mocked(readValue).mockResolvedValue({ viewMode: EViewMode.COMPACT });

    await expect(updateSettings("u1", { viewMode: EViewMode.COMPACT })).resolves.toEqual({ viewMode: EViewMode.COMPACT });
    expect(updateValues).toHaveBeenCalledExactlyOnceWith("users/u1/settings", { viewMode: EViewMode.COMPACT });
  });
});
