import { Nullable } from "../nullable.type";



export interface IPlayerState {
  currentPlayer: Nullable<string>;

  pausePlayer: () => void;
  playPlayer: (id: string) => void;
}