const FIREBASE = {
  WXT_FIREBASE_API_KEY: "key",
  WXT_FIREBASE_AUTH_DOMAIN: "auth.test",
  WXT_FIREBASE_DATABASE_URL: "https://db.test",
  WXT_FIREBASE_PROJECT_ID: "project",
  WXT_FIREBASE_STORAGE_BUCKET: "bucket",
  WXT_FIREBASE_MEASUREMENT_ID: "G-1",
  WXT_FIREBASE_APP_ID: "app",
  WXT_FIREBASE_MESSAGING_SENDER_ID: "sender",
};

/**
 * @description
 * Sets the Firebase variables, with some overridden.
 *
 * @param overrides - Variables to replace
 */
function stubFirebase(overrides: Record<string, string> = {}): void {
  for (const [name, value] of Object.entries({ ...FIREBASE, ...overrides })) {
    vi.stubEnv(name, value);
  }
}

/**
 * @description
 * Loads the module afresh, so its cached configuration is empty.
 *
 * @returns The module
 */
async function loadEnv() {
  vi.resetModules();

  return import("./env");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getFirebaseConfig", () => {
  it("reads the configuration from the build environment", async () => {
    stubFirebase();
    const { getFirebaseConfig } = await loadEnv();

    expect(getFirebaseConfig()).toEqual({
      apiKey: "key",
      authDomain: "auth.test",
      databaseURL: "https://db.test",
      projectId: "project",
      storageBucket: "bucket",
      measurementId: "G-1",
      appId: "app",
      messagingSenderId: "sender",
    });
  });

  it("validates once and keeps the result", async () => {
    stubFirebase();
    const { getFirebaseConfig } = await loadEnv();
    const first = getFirebaseConfig();

    vi.stubEnv("WXT_FIREBASE_API_KEY", "other");

    expect(getFirebaseConfig()).toBe(first);
    expect(getFirebaseConfig().apiKey).toBe("key");
  });

  it("throws naming the variables when one is missing", async () => {
    stubFirebase({ WXT_FIREBASE_APP_ID: "" });
    const { getFirebaseConfig } = await loadEnv();

    expect(() => getFirebaseConfig()).toThrow(/Invalid Firebase configuration \(check the WXT_FIREBASE_\* variables\)[\s\S]*appId/);
  });

  it("does not keep an invalid configuration", async () => {
    stubFirebase({ WXT_FIREBASE_APP_ID: "" });
    const { getFirebaseConfig } = await loadEnv();

    expect(() => getFirebaseConfig()).toThrow();

    vi.stubEnv("WXT_FIREBASE_APP_ID", "app");

    expect(getFirebaseConfig().appId).toBe("app");
  });
});

describe("getYouTubeApiKey", () => {
  it("returns the configured key", async () => {
    vi.stubEnv("WXT_YOUTUBE_DATA_API_KEY", "yt-key");
    const { getYouTubeApiKey } = await loadEnv();

    expect(getYouTubeApiKey()).toBe("yt-key");
  });

  it("returns an empty string when it is not configured", async () => {
    vi.stubEnv("WXT_YOUTUBE_DATA_API_KEY", undefined as unknown as string);
    const { getYouTubeApiKey } = await loadEnv();

    expect(getYouTubeApiKey()).toBe("");
  });
});
