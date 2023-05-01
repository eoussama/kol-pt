import Vimeo from "@vimeo/player";
import { usePlayerStore } from "../state/player.state";
import { useCallback, useEffect, useMemo, useState } from "react";



/**
 * @description
 * A custom hook to manage a Vimeo player for a given post
 *
 * @param postId The id of the post
 *
 * @returns An object containing a function to skip the player to a specified time
 * and the current time of the player
 */
export function usePlayer(postId: string) {
  const [playback, setPlayback] = useState(0);
  const [playing, setPlaying] = useState(false);
  const { playerPostId, play } = usePlayerStore();

  const video = useMemo<HTMLIFrameElement>(() => document.querySelector(`[data-kol_pt_id="${postId}"] iframe`)!, [postId]);
  const player = useMemo(() => new Vimeo(video), [video]);

  /**
   * @description
   * Skips to time stop
   */
  const onSkip = useCallback(async (seconds: number) => {
    player.play();
    player.setCurrentTime(seconds);

    video.scrollIntoView({ behavior: 'smooth' });
  }, [player]);

  // Pausing the player if another player is playing
  useEffect(() => {
    if (playerPostId !== postId) {
      player.pause();
    }
  }, [playerPostId]);

  // Marking the player as active
  useEffect(() => {
    if (playing && playerPostId !== postId) {
      play(postId);
    }
  }, [playing]);

  player.on('play', () => setPlaying(true));
  player.on('pause', () => setPlaying(false));
  player.on('timeupdate', e => setPlayback(e.seconds));

  return { playerPostId, playing, playback, player, onSkip };
}