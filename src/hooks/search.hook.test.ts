import { act, renderHook } from "@testing-library/react";
import { useSearch } from "./search.hook";



const items = ["Episode 1", "Episode 12", "Finale"];
const toText = (item: string) => item;

function type(value: string) {
  return { target: { value } } as React.ChangeEvent<HTMLInputElement>;
}

describe("useSearch", () => {
  it("lists everything until a query is typed", () => {
    const { result } = renderHook(() => useSearch(items, toText));

    expect(result.current.filtered).toEqual(items);
  });

  it("filters by text, ignoring case and surrounding spaces", () => {
    const { result } = renderHook(() => useSearch(items, toText));

    act(() => result.current.onSearch(type(" EPISODE 1 ")));
    expect(result.current.filtered).toEqual(["Episode 1", "Episode 12"]);

    act(() => result.current.onSearch(type("nothing")));
    expect(result.current.filtered).toEqual([]);
    expect(result.current.search).toBe("nothing");
  });
});
