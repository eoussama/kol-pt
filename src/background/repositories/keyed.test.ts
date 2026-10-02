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

  it("tells keyed lists from arrays and misplaced items", () => {
    expect(isKeyed(posts, "tags")).toBe(false);
    expect(isKeyed(toKeyed(posts, "tags"), "tags")).toBe(true);
    expect(isKeyed({ "post-1": { id: "post-1", tags: [{ id: "a" }] } }, "tags")).toBe(false);
    expect(isKeyed({ wrong: { id: "post-1" } })).toBe(false);
    expect(isKeyed(null)).toBe(true);
  });

  it("drops undefined fields", () => {
    expect(withoutUndefined({ a: 1, b: undefined, c: { d: undefined } })).toEqual({ a: 1, c: {} });
  });
});
