import { useEffect, useMemo, useState } from "react";
import { useEntriesStore } from "../state/entries.state";



/**
 * @description
 * A custom hook to manage entries and filtering
 *
 * @returns An object containing a function for serching and meta
 * vars about the entries
 */
export function useEntries() {
  const [search, setSearch] = useState('');
  const error = useEntriesStore(e => e.error);
  const entries = useEntriesStore(e => e.entries);
  const loading = useEntriesStore(e => e.loading);
  const loadEntries = useEntriesStore(e => e.loadEntries);
  const filteredEntries = useMemo(() => entries.filter(entrie => entrie.match(search)), [search, entries]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  /**
   * @description
   * Handles list search
   *
   * @param e The search event object
   */
  const onSearch = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const value = (e.target.value ?? '').toLowerCase();
    setSearch(value);
  }

  return { error, loading, search, entries: filteredEntries, entriesCount: entries.length, onSearch };
}