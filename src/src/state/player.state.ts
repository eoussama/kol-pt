import { create } from "zustand";
import { IPlayerState } from "../core/types/state/player-state.type";



export const usePlayerStore = create<IPlayerState>(set => ({
  currentPlayer: null,

  pausePlayer() { set({ currentPlayer: null }) },
  playPlayer(id) { set({ currentPlayer: id }) }
}));