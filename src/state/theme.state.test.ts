import { useThemeStore } from "./theme.state";



describe("theme store", () => {
  beforeEach(() => {
    useThemeStore.setState(useThemeStore.getInitialState());
  });

  it("starts light", () => {
    expect(useThemeStore.getState().mode).toBe("light");
  });

  it("changes the mode", () => {
    useThemeStore.getState().setMode("dark");
    expect(useThemeStore.getState().mode).toBe("dark");

    useThemeStore.getState().setMode("light");
    expect(useThemeStore.getState().mode).toBe("light");
  });
});
