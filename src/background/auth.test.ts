import { GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signOut } from "firebase/auth/web-extension";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { authUserItem } from "../core/storage/items";
import { requireUser, signInWithGoogleToken, signOutUser, toAuthUser, watchAuthState } from "./auth";



const firebaseUser = { uid: "u1", email: "u1@example.com", displayName: "Viewer", photoURL: "https://example.com/a.png", refreshToken: "secret" };
const auth = {
  currentUser: null as unknown,
  authStateReady: vi.fn(async () => undefined),
};

vi.mock("firebase/auth/web-extension", () => ({
  GoogleAuthProvider: { credential: vi.fn((idToken: string) => ({ idToken })) },
  onAuthStateChanged: vi.fn(() => () => undefined),
  signInWithCredential: vi.fn(),
  signOut: vi.fn(async () => undefined),
}));
vi.mock("./firebase", () => ({ getFirebaseAuth: () => auth }));

describe("auth", () => {
  beforeEach(() => {
    fakeBrowser.reset();
    auth.currentUser = null;
    auth.authStateReady.mockReset().mockResolvedValue(undefined);
    vi.mocked(onAuthStateChanged).mockClear();
    vi.mocked(signInWithCredential).mockReset();
    vi.mocked(signOut).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps only what pages need to know about a user", () => {
    expect(toAuthUser(firebaseUser as never)).toEqual({ uid: "u1", email: "u1@example.com", displayName: "Viewer", photoURL: "https://example.com/a.png" });
  });

  it("publishes the signed-in user to storage and to the listener, and stops watching", async () => {
    const stop = vi.fn();
    const onChange = vi.fn();

    vi.mocked(onAuthStateChanged).mockReturnValue(stop);

    expect(watchAuthState(onChange)).toBe(stop);

    const listener = vi.mocked(onAuthStateChanged).mock.calls[0]?.[1] as unknown as (user: unknown) => void;

    expect(vi.mocked(onAuthStateChanged).mock.calls[0]?.[0]).toBe(auth);

    listener(firebaseUser);

    await vi.waitFor(async () => expect(await authUserItem.getValue()).toEqual(toAuthUser(firebaseUser as never)));
    expect(onChange).toHaveBeenLastCalledWith(toAuthUser(firebaseUser as never));

    listener(null);

    await vi.waitFor(async () => expect(await authUserItem.getValue()).toBeNull());
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("works without a listener, and survives storage failing", async () => {
    vi.spyOn(authUserItem, "setValue").mockRejectedValueOnce(new Error("Storage failed"));
    watchAuthState();

    const listener = vi.mocked(onAuthStateChanged).mock.calls[0]?.[1] as unknown as (user: unknown) => void;

    expect(() => listener(firebaseUser)).not.toThrow();
    await vi.waitFor(() => expect(authUserItem.setValue).toHaveBeenCalledWith(toAuthUser(firebaseUser as never)));
  });

  it("signs in with the Google ID token", async () => {
    vi.mocked(signInWithCredential).mockResolvedValue({ user: firebaseUser } as never);

    await expect(signInWithGoogleToken("token")).resolves.toEqual(toAuthUser(firebaseUser as never));
    expect(GoogleAuthProvider.credential).toHaveBeenCalledWith("token");
    expect(signInWithCredential).toHaveBeenCalledWith(auth, { idToken: "token" });
  });

  it("signs out", async () => {
    await signOutUser();

    expect(signOut).toHaveBeenCalledExactlyOnceWith(auth);
  });

  it("returns the user once the saved session is restored", async () => {
    auth.authStateReady.mockImplementation(async () => {
      auth.currentUser = firebaseUser;
    });

    await expect(requireUser()).resolves.toBe(firebaseUser);
  });

  it("refuses when nobody is signed in", async () => {
    await expect(requireUser()).rejects.toThrow("Not signed in");
  });

  it("stops waiting for the session after five seconds", async () => {
    vi.useFakeTimers();
    auth.authStateReady.mockReturnValue(new Promise(() => undefined));

    let settled = false;
    const result = requireUser().finally(() => {
      settled = true;
    });
    const rejection = expect(result).rejects.toThrow("Not signed in");

    await vi.advanceTimersByTimeAsync(4999);
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await rejection;
    expect(settled).toBe(true);
  });
});
