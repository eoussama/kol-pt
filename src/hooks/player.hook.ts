import Vimeo from "@vimeo/player";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePlayerStore } from "../state/player.state";



/**
 * @description
 * A custom hook to manage a Vimeo player for a given post.
 * The Vimeo iframe may not exist in the DOM at mount time because
 * Patreon loads it lazily. The hook defers player initialisation until
 * the iframe actually appears, so the component can render safely
 * even before the video is loaded.
 *
 * @param postId The id of the post
 * @returns An object containing a function to skip the player to a specified time
 * and the current time of the player
 */
export function usePlayer(postId: string) {
  const play = usePlayerStore(e => e.play);
  const [playback, setPlayback] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const playerPostId = usePlayerStore(e => e.playerPostId);
  const playerRef = useRef<Vimeo | null>(null);

  /**
   * @description
   * Returns the Vimeo player if it has been initialised, or null.
   *
   * @returns The Vimeo player instance or null
   */
  const getPlayer = (): Vimeo | null => playerRef.current;

  /**
   * @description
   * Initialises the Vimeo player from the iframe element.
   *
   * @param iframe - The target iframe element
   */
  const initPlayer = useCallback((iframe: HTMLIFrameElement) => {
    if (playerRef.current) {
      return;
    }

    const instance = new Vimeo(iframe);

    instance.on("play", () => setPlaying(true));
    instance.on("pause", () => setPlaying(false));
    instance.on("timeupdate", e => setPlayback(e.seconds));

    playerRef.current = instance;
    setPlayerReady(true);
  }, []);

  // Wait for the iframe to be inserted into the post card and then init the player.
  useEffect(() => {
    const postCard = document.querySelector(`[data-kol_pt_id="${postId}"]`) as HTMLElement | null;

    if (!postCard) {
      return;
    }

    const existing = postCard.querySelector("iframe") as HTMLIFrameElement | null;

    if (existing) {
      initPlayer(existing);

      return;
    }

    const observer = new MutationObserver(() => {
      const iframe = postCard.querySelector("iframe") as HTMLIFrameElement | null;

      if (iframe) {
        observer.disconnect();
        initPlayer(iframe);
      }
    });

    observer.observe(postCard, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [postId, initPlayer]);

  // Pausing the player if another player is playing
  useEffect(() => {
    if (playerPostId !== postId) {
      getPlayer()?.pause();
    }
  }, [playerPostId]);

  // Marking the player as active
  useEffect(() => {
    if (playing && playerPostId !== postId) {
      play(postId);
    }
  }, [playing]);

  /**
   * @description
   * Skips to a time stop in the video.
   *
   * @param seconds - The timestamp in seconds
   */
  const onSkip = useCallback(async (seconds: number) => {
    const p = getPlayer();
    const postCard = document.querySelector(`[data-kol_pt_id="${postId}"]`) as HTMLElement | null;
    const iframe = postCard?.querySelector("iframe") as HTMLIFrameElement | null;

    if (!p || !iframe) {
      return;
    }

    p.play();
    p.setCurrentTime(seconds);
    iframe.scrollIntoView({ behavior: "smooth" });
  }, [postId]);

  return { playerPostId, playing, playback, playerReady, player: playerRef.current, onSkip };
}
