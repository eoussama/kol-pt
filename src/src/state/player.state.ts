import { create } from "zustand";
import { IPlayerState } from "../core/types/state/player-state.type";



/**
 * @description
 * State management store for player (Vimeo).
 */
export const usePlayerStore = create<IPlayerState>(set => ({

  /**
   * @description
   * The ID of the currently playing post or null if no post is playing.
   */
  playerPostId: null,

  /**
   * @description
   * A function that pauses the currently playing post.
   */
  pause(): void { set({ playerPostId: null }) },

  /**
   * @description
   * A function that sets the currently playing post
   *
   * @param id The ID of the currently playing post
   */
  play(id: string): void { set({ playerPostId: id }) }
}));