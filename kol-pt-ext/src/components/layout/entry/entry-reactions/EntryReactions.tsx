import styles from './EntryReactions.module.scss';

import { IconButton, Tooltip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { IReaction } from '../../../../core/types/reaction.type';
import { NavigationHelper } from '../../../../core/helpers/navigator/navigation.helper';
import { IEntryPageReactionsSectionProps } from '../../../../core/types/props/entry-reactions.props.type';



/**
 * @description
 * Renders the entry related reactions.
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
    <div className={styles['entry-reactions']}>
      <div className={styles['title']}>Reactions</div>

      <ul className={styles['reactions']}>
        {reactions.map((reaction, i) => <li
          key={i}
          className={styles['reaction']}
        >
          <div className={styles['reaction__left']}>
            <div className={styles['reaction__title']}>
              {reaction.tag.getDetailDescription()}
            </div>

            <div className={styles['reaction__date']}>
              {reaction.date.toLocaleDateString()}
            </div>
          </div>

          <div className={styles['reaction__right']}>
            <Tooltip title="Watch reaction">
              <IconButton
                size='small'
                aria-label="restart reaction"
                className={styles['reaction__skip']}
                onClick={() => onWatch(reaction)}
              >
                <PlayArrowIcon />
              </IconButton>
            </Tooltip>
          </div>
        </li>)}
      </ul>
    </div>
  );
}

export default EntryReactions;