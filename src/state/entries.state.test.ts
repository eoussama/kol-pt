import type { TEntry } from "../core/schemas/entry/entry.schema";

import { Anime } from "../core/domain/anime";
import { Entry } from "../core/domain/entry";
import { EEntryType } from "../core/enums/entry-type.enum";
import { request } from "../core/messaging/client";
import { useEntriesStore } from "./entries.state";



vi.mock("../core/messaging/client", () => ({ request: vi.fn() }));

const requestMock = vi.mocked(request);

const data: Array<TEntry> = [
  { id: "e1", title: "Frieren", type: EEntryType.ANIME, malId: 1, altTitles: [] },
  { id: "e2", title: "Severance", type: EEntryType.TV_SHOW, altTitles: [] },
];

describe("entries store", () => {
  beforeEach(() => {
    requestMock.mockReset();
    useEntriesStore.setState({ entries: [], error: false, loading: false });
  });

  it("starts with no entries, no error, and nothing loading", () => {
    expect(useEntriesStore.getInitialState()).toMatchObject({ entries: [], error: false, loading: false });
  });

  it("loads the entries as domain objects, allowing the cache by default", async () => {
    requestMock.mockResolvedValue(data);

    await useEntriesStore.getState().loadEntries();

    const { entries, error, loading } = useEntriesStore.getState();

    expect(requestMock).toHaveBeenCalledExactlyOnceWith("entries.list", { force: false });
    expect(entries.map(e => e.id)).toEqual(["e1", "e2"]);
    expect(entries[0]).toBeInstanceOf(Anime);
    expect(entries[1]).toBeInstanceOf(Entry);
    expect(error).toBe(false);
    expect(loading).toBe(false);
  });

  it("forces a fresh load when the cache is skipped", async () => {
    requestMock.mockResolvedValue([]);

    await useEntriesStore.getState().loadEntries(false);

    expect(requestMock).toHaveBeenCalledWith("entries.list", { force: true });
  });

  it("shows it is loading while nothing is shown yet", async () => {
    let resolve: (value: Array<TEntry>) => void = () => undefined;

    requestMock.mockReturnValue(new Promise((r) => {
      resolve = r;
    }));

    const loading = useEntriesStore.getState().loadEntries();

    expect(useEntriesStore.getState().loading).toBe(true);

    resolve(data);
    await loading;
    expect(useEntriesStore.getState().loading).toBe(false);
  });

  it("keeps what is shown, without a loading state, while reloading", async () => {
    useEntriesStore.setState({ entries: data.map(e => new Entry(e)) });

    let resolve: (value: Array<TEntry>) => void = () => undefined;

    requestMock.mockReturnValue(new Promise((r) => {
      resolve = r;
    }));

    const loading = useEntriesStore.getState().loadEntries();

    expect(useEntriesStore.getState().loading).toBe(false);
    expect(useEntriesStore.getState().entries).toHaveLength(2);

    resolve([data[0]!]);
    await loading;
    expect(useEntriesStore.getState().entries).toHaveLength(1);
  });

  it("flags the error, and stops loading, when the load fails; the next load clears it", async () => {
    requestMock.mockRejectedValueOnce(new Error("offline"));

    await useEntriesStore.getState().loadEntries();
    expect(useEntriesStore.getState()).toMatchObject({ error: true, loading: false, entries: [] });

    requestMock.mockResolvedValueOnce(data);
    await useEntriesStore.getState().loadEntries();
    expect(useEntriesStore.getState().error).toBe(false);
  });
});
