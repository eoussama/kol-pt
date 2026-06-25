import type { IEntryPageReactionsSectionProps } from "../../../../core/types/props/entry-reactions.props.type";

import type { IReaction } from "../../../../core/types/reaction.type";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { IconButton, Tooltip } from "@mui/material";
import { NavigationHelper } from "../../../../core/helpers/navigator/navigation.helper";
import styles from "./EntryReactions.module.scss";



/**
 * @description
 * Renders the entry related reactions.
 *
 * @param props - The component's properties
 * @returns The rendered reactions list section
 */
function EntryReactions(props: IEntryPageReactionsSectionProps): JSX.Element {
  const { reactions } = props;

  /**
   * @description
   * Redirects user to watch a specific reaction.
   *
   * @param reaction The reaction to watch.
   */
  const onWatch = (reaction: IReaction) => {
    NavigationHelper.openReaction(reaction.postId, reaction.tag.id);
  };

  return (
    <div className={styles["entry-reactions"]}>
      <div className={styles.title}>Reactions</div>

      <ul className={styles.reactions}>
        {reactions.map((reaction, i) => (
          <li
            key={i}
            className={styles.reaction}
          >
            <div className={styles.reaction__left}>
              <div className={styles.reaction__title}>
                {reaction.tag.getDetailDescription()}
              </div>

              <div className={styles.reaction__date}>
                {reaction.date.toLocaleDateString()}
              </div>
            </div>

            <div className={styles.reaction__right}>
              <Tooltip title="Watch reaction">
                <IconButton
                  size="small"
                  aria-label="restart reaction"
                  className={styles.reaction__skip}
                  onClick={() => onWatch(reaction)}
                >
                  <PlayArrowIcon />
                </IconButton>
              </Tooltip>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default EntryReactions;
