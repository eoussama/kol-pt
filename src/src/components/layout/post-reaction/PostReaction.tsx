import styles from './PostReaction.module.scss';

import { useContext } from 'react';
import ReplayIcon from '@mui/icons-material/Replay';
import { Tag } from '../../../core/models/tag.model';
import { usePlayer } from '../../../hooks/player.hook';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Chip, IconButton, Tooltip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { PostContext } from '../../../context/PostContext';
import { ReactionMenuContext } from '../../../context/ReactionMenuContext';
import { IPostReactionProps } from '../../../core/types/props/post-reaction-props.type';



/**
 * @description
 * A React component that renders a single post reaction with skip and more buttons.
 * 
 * @param props The props object containing the necessary properties to render the component.
 */
function PostReaction(props: IPostReactionProps): JSX.Element {
  const { tag } = props;
  const { post } = useContext(PostContext);
  const { playing, playback, onSkip } = usePlayer(post.id);
  const { setAnchorOpened, setAnchorEl, setTag } = useContext(ReactionMenuContext);

  /**
   * @description
   * Checks whether the associated reaction is currently being played
   */
  const isPlaying = () => {
    return tag.startTime <= playback && playback <= tag.endTime;
  }

  /**
    * @description
    * Triggers the more menu
    * 
    * @param event The mouse clicked event, provides extra content for the Mui menu
    * @param tag The tag to show the menu for
    */
  const onMore = (event: React.MouseEvent<HTMLElement>, tag: Tag) => {
    setTag(tag);
    setAnchorEl(event.currentTarget);
    setAnchorOpened(true);
  };

  return <>
    <li key={tag.id} className={styles['reaction']}>
      <div className={styles['reaction__left']}>
        <div className={styles['reaction__title']}>
          {tag.entry.title}
          {isPlaying() && <Chip
            size='small'
            label={playing ? 'Playing' : 'Paused'}
            className={styles['reaction__playing']}
          />}
        </div>

        <div className={styles['reaction__description']}>
          {tag.getDetailDescription()}

          <span className={styles['reaction__extra']}>
            , Starts at <span
              className={styles['reaction__highlight']}
              onClick={() => onSkip(tag.startTime)}>{tag.getReadableStartTime()}
            </span>
            , Duration: {tag.getReadableDuration()}
          </span>
        </div>
      </div>

      <div className={styles['reaction__right']}>
        {!isPlaying() && <Tooltip title="Skip to reaction">
          <IconButton
            size='small'
            aria-label="skip to reaction"
            className={styles['reaction__skip']}
            onClick={() => onSkip(tag.startTime)}
          >
            <PlayArrowIcon />
          </IconButton>
        </Tooltip>}

        {isPlaying() && <Tooltip title="Restart reaction">
          <IconButton
            size='small'
            aria-label="restart reaction"
            className={styles['reaction__skip']}
            onClick={() => onSkip(tag.startTime)}
          >
            <ReplayIcon />
          </IconButton>
        </Tooltip>}

        <Tooltip title="More">
          <IconButton
            size='small'
            aria-label='more'
            onClick={e => onMore(e, tag)}
          >
            <MoreVertIcon />
          </IconButton>
        </Tooltip>
      </div>
    </li>
  </>
}

export default PostReaction;