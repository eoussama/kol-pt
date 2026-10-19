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

  it("lists everything again when the input has no text", () => {
    const { result } = renderHook(() => useSearch(items, toText));

    act(() => result.current.onSearch(type("finale")));
    expect(result.current.filtered).toEqual(["Finale"]);

    act(() => result.current.onSearch({ target: {} } as React.ChangeEvent<HTMLInputElement>));
    expect(result.current.search).toBe("");
    expect(result.current.filtered).toEqual(items);
  });

  it("follows the list and how its items are read", () => {
    const { result, rerender } = renderHook(({ list, read }) => useSearch(list, read), { initialProps: { list: items, read: toText } });

    act(() => result.current.onSearch(type("fin")));
    expect(result.current.filtered).toEqual(["Finale"]);

    rerender({ list: ["Finale", "Final cut", "Pilot"], read: toText });
    expect(result.current.filtered).toEqual(["Finale", "Final cut"]);

    rerender({ list: ["Finale", "Final cut", "Pilot"], read: (item: string) => item.replace("Fin", "") });
    expect(result.current.filtered).toEqual([]);
  });

  it("returns a copy of the list, not the list itself", () => {
    const { result } = renderHook(() => useSearch(items, toText));

    expect(result.current.filtered).not.toBe(items);
  });
});
