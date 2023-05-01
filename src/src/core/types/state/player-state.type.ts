import { Nullable } from "../nullable.type";



/**
 * @description
 * Interface representing the state of a (video) player.
 */
export interface IPlayerState {

  /**
   * @description
   * The currently selected (video) player's post ID, or `null` if no player is currently selected.
   */
  playerPostId: Nullable<string>;

  /**
   * @description
   * Function to pause the currently selected player.
   */
  pause: () => void;

  /**
   * @description
   * Function to select and play a specific player with the given ID.
   * 
   * @param id - The ID of the player to play.
   */
  play: (id: string) => void;
}
