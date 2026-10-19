import type { ICached, TKeyedCache } from "../core/storage/items";

import { fakeBrowser } from "wxt/testing/fake-browser";
import { storage } from "wxt/utils/storage";
import { cached, cachedEach } from "./cache";



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

describe("cachedEach", () => {
  const item = storage.defineItem<TKeyedCache<string>>("local:test-keyed-cache", { fallback: {} });
  const ttlMs = 1000;
  let now = 0;
  const clock = () => now;

  beforeEach(() => {
    fakeBrowser.reset();
    now = 10_000;
  });

  it("loads only the missing or expired keys, together, and keeps what was found", async () => {
    await item.setValue({ fresh: { updatedAt: now - 500, data: "cached" }, old: { updatedAt: now - 5000, data: "stale" } });

    const load = vi.fn(async (keys: Array<string>) => new Map(keys.filter(key => key !== "unknown").map(key => [key, `loaded ${key}`])));
    const found = await cachedEach(item, ["fresh", "old", "new", "unknown"], load, { ttlMs, now: clock });

    expect(load).toHaveBeenCalledWith(["old", "new", "unknown"]);
    expect(Object.fromEntries(found)).toEqual({ fresh: "cached", old: "loaded old", new: "loaded new" });
    expect(Object.keys(await item.getValue()).sort()).toEqual(["fresh", "new", "old"]);
  });

  it("falls back to stale values when loading fails", async () => {
    await item.setValue({ old: { updatedAt: now - 5000, data: "stale" } });

    const found = await cachedEach(item, ["old", "new"], async () => Promise.reject(new Error("offline")), { ttlMs, now: clock });

    expect(Object.fromEntries(found)).toEqual({ old: "stale" });
  });

  it("does not load when everything is fresh", async () => {
    await item.setValue({ a: { updatedAt: now, data: "a" } });

    const load = vi.fn(async () => new Map<string, string>());

    await cachedEach(item, ["a", "a"], load, { ttlMs, now: clock });
    expect(load).not.toHaveBeenCalled();
  });
});
