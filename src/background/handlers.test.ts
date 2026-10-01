import { browser } from "wxt/browser";
import { signInWithGoogleToken } from "./auth";
import { handlers } from "./handlers";



vi.mock("./auth", () => ({
  requireUser: vi.fn(),
  signOutUser: vi.fn(async () => undefined),
  signInWithGoogleToken: vi.fn(async () => ({ uid: "u1", email: null, displayName: null, photoURL: null })),
}));

const signInRequest = { channel: "kol-pt", type: "auth.signIn", idToken: "token" } as const;

describe("auth handlers", () => {
  it("sign in from an extension page", async () => {
    const sender = { id: browser.runtime.id, url: browser.runtime.getURL("/popup.html") };

    await expect(handlers["auth.signIn"](signInRequest, sender)).resolves.toMatchObject({ uid: "u1" });
    expect(signInWithGoogleToken).toHaveBeenCalledWith("token");
  });

  it("refuse to sign in or out from a website", async () => {
    const sender = { id: browser.runtime.id, url: "https://www.patreon.com/posts/1", tab: { id: 1 } as never };

    await expect(handlers["auth.signIn"](signInRequest, sender)).rejects.toThrow("only allowed from the extension");
    await expect(handlers["auth.signOut"]({ channel: "kol-pt", type: "auth.signOut" }, sender)).rejects.toThrow("only allowed from the extension");
  });
});
