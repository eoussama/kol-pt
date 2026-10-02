import type { IEntriesState } from "../core/types/state/entries-state.type";

import { create } from "zustand";
import { createEntry } from "../core/domain/hydrate";
import { request } from "../core/messaging/client";



/**
 * @description
 * State management for entries.
 */
export const useEntriesStore = create<IEntriesState>(set => ({

  /**
   * @description
   * Array of entries.
   */
  entries: [],

  /**
   * @description
   * If an error has occured.
   */
  error: false,

  /**
   * @description
   * Flag to indicate if entries are currently being loaded.
   */
  loading: false,

  /**
   * @description
   * Loads entries from cache or from Firebase and sets the entries array.
   *
   * @param cache - If true, tries to load the entries from cache first,
   * then falls back to Firebase if no cache is available. If false, forces a load from Firebase.
   * @returns Promise that resolves when entries are loaded
   */
  loadEntries: async (cache: boolean = true) => {
    try {
      set({ error: false });
      set({ loading: true });

      const entries = await request("entries.list", { force: !cache });

      set({ entries: entries.map(createEntry) });
    }
    catch {
      set({ error: true });
    }
    finally {
      set({ loading: false });
    }
  },
}));
