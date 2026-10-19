import { isKeyed, toKeyed, withoutUndefined } from "./keyed";



describe("keyed lists", () => {
  const posts = [
    { id: "post-1", title: "One", tags: [{ id: "t.1", label: "a" }, null, { id: 7, label: "b" }], extra: true },
    null,
    { title: "No id" },
    { id: 42, title: "Numeric" },
  ];

  it("keys a stored array by id, nested lists included, keeping unknown fields", () => {
    expect(toKeyed(posts, "tags")).toEqual({
      "post-1": { id: "post-1", title: "One", extra: true, tags: { t_1: { id: "t.1", label: "a" }, 7: { id: 7, label: "b" } } },
      "42": { id: 42, title: "Numeric" },
    });
  });

  it("drops items that are not objects", () => {
    expect(toKeyed(["text", 5, [{ id: "nested-in-array" }], { id: "a" }])).toEqual({ a: { id: "a" } });
  });

  it("leaves items without the nested list as they are", () => {
    expect(toKeyed([{ id: "post-1", title: "One" }, { id: "post-2", tags: null }], "tags")).toEqual({
      "post-1": { id: "post-1", title: "One" },
      "post-2": { id: "post-2", tags: null },
    });
    expect(isKeyed({ "post-1": { id: "post-1" } }, "tags")).toBe(true);
  });

  it("tells keyed lists from arrays and misplaced items", () => {
    expect(isKeyed(posts, "tags")).toBe(false);
    expect(isKeyed(toKeyed(posts, "tags"), "tags")).toBe(true);
    expect(isKeyed({ "post-1": { id: "post-1", tags: [{ id: "a" }] } }, "tags")).toBe(false);
    expect(isKeyed({ wrong: { id: "post-1" } })).toBe(false);
    expect(isKeyed(null)).toBe(true);
  });

  it("is only keyed when every item is stored under its own id", () => {
    expect(isKeyed({ a: { id: "a" }, wrong: { id: "b" } })).toBe(false);
    expect(isKeyed({ wrong: { id: "b" }, a: { id: "a" } })).toBe(false);
    expect(isKeyed({ a: { id: "a" }, b: { id: "b" } })).toBe(true);
  });

  it("is not keyed when a value is not a database object", () => {
    expect(isKeyed({ a: null })).toBe(false);
    expect(isKeyed({ a: "text" })).toBe(false);
    expect(isKeyed({ 0: [{ id: "0" }] })).toBe(false);
    expect(isKeyed([{ id: "0" }])).toBe(false);
    expect(isKeyed([])).toBe(false);
    expect(isKeyed("")).toBe(false);
    expect(isKeyed(0)).toBe(false);
  });

  it("drops undefined fields", () => {
    expect(withoutUndefined({ a: 1, b: undefined, c: { d: undefined } })).toEqual({ a: 1, c: {} });
  });
});
