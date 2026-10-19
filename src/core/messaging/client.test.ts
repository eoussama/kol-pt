import { fakeBrowser } from "wxt/testing/fake-browser";
import { request } from "./client";
import { MESSAGE_CHANNEL } from "./protocol";



beforeEach(() => {
  fakeBrowser.reset();
});

/**
 * @description
 * Answers every message the extension sends with the given reply.
 *
 * @param reply - What the background responds with
 * @returns The spy that receives the messages
 */
function answerWith(reply: unknown) {
  return vi.spyOn(fakeBrowser.runtime, "sendMessage").mockResolvedValue(reply as never);
}

describe("request", () => {
  it("sends the request on the extension's channel, with its payload flattened in", async () => {
    const spy = answerWith({ ok: true, data: [] });

    await request("posts.list", { force: true });

    expect(spy).toHaveBeenCalledExactlyOnceWith({ channel: MESSAGE_CHANNEL, type: "posts.list", force: true });
  });

  it("resolves to the response's data", async () => {
    answerWith({ ok: true, data: { moderator: true } });

    await expect(request("moderation.refresh", {})).resolves.toEqual({ moderator: true });
  });

  it("keeps falsy data", async () => {
    answerWith({ ok: true, data: null });

    await expect(request("auth.signOut", {})).resolves.toBeNull();
  });

  it("rejects with the background's error", async () => {
    answerWith({ ok: false, error: "Not allowed" });

    await expect(request("posts.delete", { postId: "1" })).rejects.toThrow("Not allowed");
  });

  it("rejects when nothing answers", async () => {
    answerWith(undefined);

    await expect(request("entries.covers", {})).rejects.toThrow("No response to \"entries.covers\"");
  });
});
