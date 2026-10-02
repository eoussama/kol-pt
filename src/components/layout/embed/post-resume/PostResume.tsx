import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RestoreIcon from "@mui/icons-material/Restore";
import { Button } from "@mui/material";
import { useContext } from "react";
import { usePlayer } from "../../../../content/player/PlayerProvider";
import { PostContext } from "../../../../context/PostContext";
import { findReactionAt } from "../../../../core/utils/progress";
import { formatTimestamp } from "../../../../core/utils/time";
import { useAuthStore } from "../../../../state/auth.state";
import { usePostProgress } from "../../../../state/progress.state";

import styles from "./PostResume.module.scss";



/**
 * @description
 * How far, in seconds, the playhead must be from the saved position for
 * resuming to be offered.
 */
const RESUME_OFFER_DISTANCE_S = 5;

/**
 * @description
 * Offers to resume a post's video where the signed-in user stopped watching
 * it. Hidden while the video plays, and when the playhead is already there.
 *
 * @returns The resume row, or nothing
 */
function PostResume(): JSX.Element | null {
  const { post } = useContext(PostContext);
  const user = useAuthStore(e => e.user);
  const progress = usePostProgress(post.id);
  const { ready, playing, currentTime, playFrom } = usePlayer();

  if (!user || !progress || !ready || playing || Math.abs(currentTime - progress.time) <= RESUME_OFFER_DISTANCE_S) {
    return null;
  }

  const reaction = findReactionAt(post.tags, progress.time);

  return (
    <div className={styles.resume}>
      <RestoreIcon className={styles.resume__icon} />

      <div className={styles.resume__text}>
        <div className={styles.resume__title}>Continue watching</div>
        <div className={styles.resume__description}>
          {reaction ? `${reaction.getTitle()} · ` : ""}
          left off at
          {" "}
          <span className={styles.resume__time}>{formatTimestamp(progress.time)}</span>
        </div>
      </div>

      <Button
        size="small"
        variant="contained"
        disableElevation
        startIcon={<PlayArrowIcon />}
        className={styles.resume__button}
        onClick={() => playFrom(progress.time)}
      >
        Resume
      </Button>
    </div>
  );
}

export default PostResume;
