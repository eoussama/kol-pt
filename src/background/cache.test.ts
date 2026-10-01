import type { ICached } from "../core/storage/items";

import { fakeBrowser } from "wxt/testing/fake-browser";
import { storage } from "wxt/utils/storage";
import { cached } from "./cache";



describe("cached", () => {
  const item = storage.defineItem<ICached<Array<string>> | null>("local:test-cache", { fallback: null });
  const ttlMs = 1000;
  let now = 0;
  const clock = () => now;

  beforeEach(() => {
    fakeBrowser.reset();
    now = 10_000;
  });

  it("loads and stores data when nothing is cached", async () => {
    const load = vi.fn(async () => ["fresh"]);

    await expect(cached(item, load, { ttlMs, now: clock })).resolves.toEqual(["fresh"]);
    await expect(item.getValue()).resolves.toEqual({ updatedAt: 10_000, data: ["fresh"] });
  });

  it("serves fresh data without loading", async () => {
    await item.setValue({ updatedAt: now - 500, data: ["cached"] });

    const load = vi.fn(async () => ["fresh"]);

    await expect(cached(item, load, { ttlMs, now: clock })).resolves.toEqual(["cached"]);
    expect(load).not.toHaveBeenCalled();
  });

  it("reloads expired data, or when forced", async () => {
    await item.setValue({ updatedAt: now - 1500, data: ["stale"] });
    await expect(cached(item, async () => ["fresh"], { ttlMs, now: clock })).resolves.toEqual(["fresh"]);

    await expect(cached(item, async () => ["forced"], { ttlMs, now: clock, force: true })).resolves.toEqual(["forced"]);
  });

  it("falls back to stale data when loading fails", async () => {
    await item.setValue({ updatedAt: now - 1500, data: ["stale"] });

    await expect(cached(item, async () => {
      throw new Error("offline");
    }, { ttlMs, now: clock })).resolves.toEqual(["stale"]);
  });

  it("fails when loading fails with nothing cached", async () => {
    await expect(cached(item, async () => {
      throw new Error("offline");
    }, { ttlMs, now: clock })).rejects.toThrow("offline");
  });
});
