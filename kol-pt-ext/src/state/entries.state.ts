import type { IEntriesState } from "../core/types/state/entries-state.type";
import { create } from "zustand";
import { EntriesHelper } from "../core/helpers/firebase/repositories/entries.helper";



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

      const data = await EntriesHelper.load(cache);

      set(() => ({ entries: data }));
    }
    catch {
      set({ error: true });
    }
    finally {
      set({ loading: false });
    }
  },
}));
