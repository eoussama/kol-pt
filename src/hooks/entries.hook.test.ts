import type { TEntry } from "../core/schemas/entry/entry.schema";

import { act, renderHook, waitFor } from "@testing-library/react";
import { EEntryType } from "../core/enums/entry-type.enum";
import { request } from "../core/messaging/client";
import { useEntriesStore } from "../state/entries.state";
import { useEntries } from "./entries.hook";



vi.mock("../core/messaging/client", () => ({ request: vi.fn() }));

const requestMock = vi.mocked(request);

const data: Array<TEntry> = [
  { id: "e1", title: "Frieren", type: EEntryType.ANIME, malId: 1, altTitles: [] },
  { id: "e2", title: "Severance", type: EEntryType.TV_SHOW, altTitles: [] },
];

/**
 * @description
 * A change event of a search input.
 *
 * @param value - What was typed
 * @returns The event
 */
function type(value: string | undefined) {
  return { target: { value } } as React.ChangeEvent<HTMLInputElement>;
}

describe("useEntries", () => {
  beforeEach(() => {
    requestMock.mockReset();
    requestMock.mockResolvedValue(data);
    useEntriesStore.setState({ entries: [], error: false, loading: false });
  });

  it("loads the entries when shown", async () => {
    const { result } = renderHook(() => useEntries());

    await waitFor(() => expect(result.current.entries.map(e => e.id)).toEqual(["e1", "e2"]));
    expect(requestMock).toHaveBeenCalledExactlyOnceWith("entries.list", { force: false });
    expect(result.current.entriesCount).toBe(2);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(false);
    expect(result.current.search).toBe("");
  });

  it("is loading until the entries are in", async () => {
    const { result } = renderHook(() => useEntries());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("filters the entries by what is typed, ignoring case, and still counts them all", async () => {
    const { result } = renderHook(() => useEntries());

    await waitFor(() => expect(result.current.entriesCount).toBe(2));

    act(() => result.current.onSearch(type("SEVER")));

    expect(result.current.search).toBe("sever");
    expect(result.current.entries.map(e => e.id)).toEqual(["e2"]);
    expect(result.current.entriesCount).toBe(2);
  });

  it("lists everything again when the search is cleared, or has no text", async () => {
    const { result } = renderHook(() => useEntries());

    await waitFor(() => expect(result.current.entriesCount).toBe(2));

    act(() => result.current.onSearch(type("sever")));
    act(() => result.current.onSearch(type(undefined)));

    expect(result.current.search).toBe("");
    expect(result.current.entries).toHaveLength(2);
  });

  it("reports an error when the entries cannot be loaded", async () => {
    requestMock.mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => useEntries());

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.entries).toEqual([]);
  });
});
