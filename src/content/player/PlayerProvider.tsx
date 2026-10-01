import type { ReactNode } from "react";
import type { IPlayerAdapter } from "./types";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePlayerStore } from "../../state/player.state";
import { waitForPlayer } from "./create-player";



/**
 * @description
 * The player state shared by a post's reactions panel.
 */
export interface IPlayerContext {

  /**
   * @description
   * Whether the post's player has been found.
   */
  ready: boolean;

  /**
   * @description
   * Whether the post's video is playing.
   */
  playing: boolean;

  /**
   * @description
   * The playhead position in seconds.
   */
  currentTime: number;

  /**
   * @description
   * Scrolls to the video, jumps to a position and plays.
   */
  playFrom: (seconds: number) => void;

  /**
   * @description
   * Moves the playhead without playing.
   */
  cue: (seconds: number) => void;
}

const PlayerContext = createContext<IPlayerContext>({
  ready: false,
  playing: false,
  currentTime: 0,
  playFrom: () => undefined,
  cue: () => undefined,
});

/**
 * @description
 * Player provider props.
 */
interface IPlayerProviderProps {
  card: HTMLElement;
  postId: string;
  children: ReactNode;
}

/**
 * @description
 * Finds the player inside a post card and shares its state with the post's
 * reactions panel. Starting one post's video pauses the others.
 *
 * @param props - The card, its post id and the children
 * @returns The provider
 */
export function PlayerProvider(props: IPlayerProviderProps): JSX.Element {
  const { card, postId, children } = props;
  const [player, setPlayer] = useState<IPlayerAdapter | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const activePostId = usePlayerStore(e => e.playerPostId);
  const setActive = usePlayerStore(e => e.play);

  useEffect(() => {
    const controller = new AbortController();
    let found: IPlayerAdapter | null = null;

    waitForPlayer(card, controller.signal).then((adapter) => {
      found = adapter;
      setPlayer(adapter);
    });

    return () => {
      controller.abort();
      found?.dispose();
      setPlayer(null);
    };
  }, [card]);

  useEffect(() => {
    if (!player) {
      return;
    }

    setPlaying(player.isPlaying());
    setCurrentTime(player.getCurrentTime());

    const removers = [
      player.on("play", () => {
        setPlaying(true);
        setActive(postId);
      }),
      player.on("pause", () => setPlaying(false)),
      player.on("timeupdate", () => setCurrentTime(player.getCurrentTime())),
    ];

    return () => removers.forEach(remove => remove());
  }, [player, postId, setActive]);

  useEffect(() => {
    if (player && activePostId !== null && activePostId !== postId && player.isPlaying()) {
      player.pause();
    }
  }, [player, activePostId, postId]);

  const playFrom = useCallback((seconds: number) => {
    if (!player) {
      return;
    }

    setActive(postId);
    player.element.scrollIntoView({ behavior: "smooth", block: "center" });
    player.playFrom(seconds).catch(() => undefined);
  }, [player, postId, setActive]);

  const cue = useCallback((seconds: number) => player?.cue(seconds), [player]);

  const value = useMemo<IPlayerContext>(
    () => ({ ready: player !== null, playing, currentTime, playFrom, cue }),
    [player, playing, currentTime, playFrom, cue],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

/**
 * @description
 * Reads the player state of the enclosing post.
 *
 * @returns The player context
 */
export function usePlayer(): IPlayerContext {
  return useContext(PlayerContext);
}
