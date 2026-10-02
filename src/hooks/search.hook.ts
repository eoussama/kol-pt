import { useMemo, useState } from "react";



/**
 * @description
 * Filters a list by a search query typed in an input. An item matches when
 * its text contains the query, ignoring case; an empty query matches all.
 *
 * @param items - The list to filter
 * @param toText - Gets the text to search in for an item
 * @returns The query, the matching items and the input's change handler
 */
export function useSearch<T>(items: ReadonlyArray<T>, toText: (item: T) => string) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return query ? items.filter(item => toText(item).toLowerCase().includes(query)) : [...items];
  }, [items, search, toText]);

  /**
   * @description
   * Handles the search input's change.
   *
   * @param e - The change event
   */
  const onSearch = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setSearch(e.target.value ?? "");
  };

  return { search, filtered, onSearch };
}
