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

  it("treats data as expired once it is as old as the age limit", async () => {
    await item.setValue({ updatedAt: now - ttlMs + 1, data: ["cached"] });
    await expect(cached(item, async () => ["fresh"], { ttlMs, now: clock })).resolves.toEqual(["cached"]);

    await item.setValue({ updatedAt: now - ttlMs, data: ["cached"] });
    await expect(cached(item, async () => ["fresh"], { ttlMs, now: clock })).resolves.toEqual(["fresh"]);
  });

  it("keeps data fresh for an hour unless told otherwise", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });

    try {
      await item.setValue({ updatedAt: Date.now() - 60 * 60 * 1000 + 1000, data: ["cached"] });
      await expect(cached(item, async () => ["fresh"])).resolves.toEqual(["cached"]);

      await item.setValue({ updatedAt: Date.now() - 60 * 60 * 1000, data: ["cached"] });
      await expect(cached(item, async () => ["fresh"])).resolves.toEqual(["fresh"]);
    }
    finally {
      vi.useRealTimers();
    }
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

  it("treats a value as expired once it is as old as the age limit", async () => {
    await item.setValue({ a: { updatedAt: now - ttlMs + 1, data: "cached" }, b: { updatedAt: now - ttlMs, data: "cached" } });

    const load = vi.fn(async (keys: Array<string>) => new Map(keys.map(key => [key, "loaded"])));
    const found = await cachedEach(item, ["a", "b"], load, { ttlMs, now: clock });

    expect(load).toHaveBeenCalledExactlyOnceWith(["b"]);
    expect(Object.fromEntries(found)).toEqual({ a: "cached", b: "loaded" });
  });

  it("drops expired values when saving, but only keeps those still fresh at that time", async () => {
    await item.setValue({
      expired: { updatedAt: now - ttlMs, data: "expired" },
      expiredLongAgo: { updatedAt: now - 5 * ttlMs, data: "old" },
      fresh: { updatedAt: now - ttlMs + 1, data: "fresh" },
    });

    await cachedEach(item, ["new"], async () => new Map([["new", "loaded"]]), { ttlMs, now: clock });

    await expect(item.getValue()).resolves.toEqual({
      fresh: { updatedAt: now - ttlMs + 1, data: "fresh" },
      new: { updatedAt: now, data: "loaded" },
    });
  });

  it("leaves the cache as it is when nothing was found", async () => {
    const stored = { old: { updatedAt: now - 5000, data: "stale" }, other: { updatedAt: now - 9000, data: "stale too" } };

    await item.setValue(stored);

    const found = await cachedEach(item, ["old", "unknown"], async () => new Map<string, string>(), { ttlMs, now: clock });

    expect(Object.fromEntries(found)).toEqual({ old: "stale" });
    await expect(item.getValue()).resolves.toEqual(stored);
  });

  it("keeps values for an hour unless told otherwise", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });

    try {
      const hour = 60 * 60 * 1000;

      await item.setValue({ a: { updatedAt: Date.now() - hour + 1000, data: "cached" }, b: { updatedAt: Date.now() - hour, data: "cached" } });

      const load = vi.fn(async (keys: Array<string>) => new Map(keys.map(key => [key, "loaded"])));

      await cachedEach(item, ["a", "b"], load);

      expect(load).toHaveBeenCalledExactlyOnceWith(["b"]);
    }
    finally {
      vi.useRealTimers();
    }
  });

  it("does not load when everything is fresh", async () => {
    await item.setValue({ a: { updatedAt: now, data: "a" } });

    const load = vi.fn(async () => new Map<string, string>());

    await cachedEach(item, ["a", "a"], load, { ttlMs, now: clock });
    expect(load).not.toHaveBeenCalled();
  });
});
