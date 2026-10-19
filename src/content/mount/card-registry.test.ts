import type { ICardEmbed } from "./card-registry";

import { CardRegistry } from "./card-registry";



/**
 * @description
 * Builds a panel for a card.
 *
 * @param card - The card
 * @param key - The panel's key
 * @returns The panel
 */
function embedOf(card: HTMLElement, key = "1-1"): ICardEmbed {
  return { key, card, host: document.createElement("div"), postId: "1", post: null, untracked: false };
}

describe("cardRegistry", () => {
  it("starts empty", () => {
    const registry = new CardRegistry();

    expect(registry.getSnapshot()).toEqual([]);
    expect(registry.values()).toEqual([]);
  });

  it("holds one panel per card, replacing the earlier one", () => {
    const registry = new CardRegistry();
    const card = document.createElement("div");
    const first = embedOf(card, "1-1");
    const second = embedOf(card, "1-2");

    registry.set(first);
    registry.set(second);

    expect(registry.get(card)).toBe(second);
    expect(registry.values()).toEqual([second]);
    expect(registry.get(document.createElement("div"))).toBeUndefined();
  });

  it("replaces the snapshot on every change, so it can be compared by reference", () => {
    const registry = new CardRegistry();
    const card = document.createElement("div");
    const empty = registry.getSnapshot();

    registry.set(embedOf(card));
    const one = registry.getSnapshot();

    expect(one).not.toBe(empty);
    expect(one).toHaveLength(1);
    expect(registry.getSnapshot()).toBe(one);

    registry.delete(card);

    expect(registry.getSnapshot()).not.toBe(one);
    expect(registry.getSnapshot()).toEqual([]);
  });

  it("tells subscribers about each change until they unsubscribe", () => {
    const registry = new CardRegistry();
    const card = document.createElement("div");
    const listener = vi.fn();
    const unsubscribe = registry.subscribe(listener);

    registry.set(embedOf(card));
    registry.delete(card);

    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    registry.set(embedOf(card));

    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("stays quiet when deleting a card without a panel", () => {
    const registry = new CardRegistry();
    const listener = vi.fn();
    const snapshot = registry.getSnapshot();

    registry.subscribe(listener);
    registry.delete(document.createElement("div"));

    expect(listener).not.toHaveBeenCalled();
    expect(registry.getSnapshot()).toBe(snapshot);
  });
});
