import styles from './PostReaction.module.scss';

import { useContext, useState } from 'react';
import ReplayIcon from '@mui/icons-material/Replay';
import { Tag } from '../../../../core/models/tag.model';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { usePlayer } from '../../../../hooks/player.hook';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { PostContext } from '../../../../context/PostContext';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Checkbox, Chip, IconButton, Tooltip } from '@mui/material';
import { ReactionOverlayContext } from '../../../../context/ReactionOverlayContext';
import { IPostReactionProps } from '../../../../core/types/props/post-reaction-props.type';
import { useAuthStore } from '../../../../state/auth.state';



/**
 * @description
 * A React component that renders a single post reaction with skip and more buttons.
 * 
 * @param props The props object containing the necessary properties to render the component.
 */
function PostReaction(props: IPostReactionProps): JSX.Element {
  const { tag } = props;
  const user = useAuthStore(e => e.user);
  const { post } = useContext(PostContext);
  const [watched, setWatched] = useState(false);
  const { playing, playback, onSkip } = usePlayer(post.id);
  const { setAnchorOpened, setAnchorEl, setTag, setDialogOpened } = useContext(ReactionOverlayContext);

  /**
   * @description
   * Checks if user is logged in
   */
  const isLoggedIn = () => {
    return Boolean(user);
  }

  /**
   * @description
   * Checks whether the associated reaction is currently being played
   */
  const isPlaying = () => {
    return tag.startTime <= playback && playback <= tag.endTime;
  }

  /**
   * @description
   * Opens detail page as a modal about the selected tag.
   *
   * @param tag The target tag to show the detail of.
   */
  const onDetail = (tag: Tag) => {
    setTag(tag);
    setDialogOpened(true);
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
      {isLoggedIn() &&
        <div className={styles['reaction__tracking']}>
          <Tooltip title={watched ? 'Mark as un-watched' : 'Mark as watched'}>
            <Checkbox
              className={styles['reaction__checkbox']}
              onChange={e => setWatched(e.target.checked)}
            />
          </Tooltip>
        </div>
      }

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
          <span
            className={`${styles['reaction__type']} ${styles['reaction__type--' + tag.entry.type]}`}
          >{tag.entry.getTypeName()}, </span>

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

        <Tooltip title="Detail">
          <IconButton
            size='small'
            aria-label='detail'
            onClick={() => onDetail(tag)}
          >
            <InfoOutlinedIcon />
          </IconButton>
        </Tooltip>

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