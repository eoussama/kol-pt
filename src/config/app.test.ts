const VARIABLES = ["WXT_PATREON_URL", "WXT_CREATOR_NAME", "WXT_FIREGUARD_URL"];

/**
 * @description
 * Loads the config afresh, after the environment was set up.
 *
 * @returns The config
 */
async function loadConfig() {
  vi.resetModules();

  return (await import("./app")).appConfig;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("appConfig", () => {
  it("falls back to the defaults when the variables are unset", async () => {
    for (const name of VARIABLES) {
      vi.stubEnv(name, "");
    }

    expect(await loadConfig()).toEqual({
      patreonUrl: "https://www.patreon.com",
      creatorName: "KingOfLightning",
      fireguardUrl: "https://ouss.es/fireguard",
    });
  });

  it("reads the variables when they are set", async () => {
    vi.stubEnv("WXT_PATREON_URL", "https://patreon.test");
    vi.stubEnv("WXT_CREATOR_NAME", "SomeoneElse");
    vi.stubEnv("WXT_FIREGUARD_URL", "https://guard.test");

    expect(await loadConfig()).toEqual({
      patreonUrl: "https://patreon.test",
      creatorName: "SomeoneElse",
      fireguardUrl: "https://guard.test",
    });
  });
});
