import styles from './PostDetail.module.scss';

import Vimeo from '@vimeo/player';
import { Tag } from '../../../core/models/tag.model';
import { Post } from '../../../core/models/post.model';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Anime } from '../../../core/models/anime.model';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Nullable } from '../../../core/types/nullable.type';
import { usePlayerStore } from '../../../state/player.state';
import { useCallback, useEffect, useMemo, useState } from 'react';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import { AccordionDetails, AccordionSummary, Chip, IconButton, Menu, MenuItem, Tooltip, styled } from '@mui/material';



const Accordion = styled((props: AccordionProps) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  '&:not(:last-child)': {
    borderBottom: 0,
  },
  '&:before': {
    display: 'none',
  },
}));

function PostDetail(props: { post: Post }) {
  const { post } = props;
  const { currentPlayer, playPlayer } = usePlayerStore();

  const [currentTime, setCurrentTime] = useState(0);
  const [expanded, setExpanded] = useState<boolean>(true);
  const [selectedTag, setSelectedTag] = useState<Nullable<Tag>>(null);

  const video = useMemo<HTMLIFrameElement>(() => document.querySelector(`[data-kol_pt_id="${post.id}"] iframe`)!, [post.id]);
  const player = useMemo(() => new Vimeo(video), [video]);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const anchorOpened = Boolean(anchorEl);

  // Updating current video time
  player.on('timeupdate', e => setCurrentTime(e.seconds));

  // Skipping to time stop
  const onSkip = useCallback(async (seconds: number) => {
    player.play();
    player.setCurrentTime(seconds);

    video.scrollIntoView({ behavior: 'smooth' });
  }, [player]);

  // Pausing the player if another player is playing
  useEffect(() => {
    if (currentPlayer !== post.id) {
      player.pause();
    }
  }, [currentPlayer]);

  // Marking the player as active
  useEffect(() => {
    playPlayer(post.id);
  }, [currentTime]);

  const onMore = (event: React.MouseEvent<HTMLElement>, tag: Tag) => {
    setSelectedTag(tag);
    setAnchorEl(event.currentTarget);
  };

  const onClose = () => {
    setAnchorEl(null);
  };

  return <>
    <Accordion
      expanded={expanded}
      className={styles['post']}
      onChange={() => setExpanded(!expanded)}
    >
      <AccordionSummary className={styles['post__head']} expandIcon={<ExpandMoreIcon />}>
        <h3 className={styles['post__title']}>{post.tags.length} reaction{post.tags.length > 1 ? 's' : ''}</h3>
      </AccordionSummary>

      <AccordionDetails className={styles['post__body']}>
        <ul className={styles['reactions']}>
          {post.tags.map(tag => <li key={tag.id} className={styles['reaction']}>
            <div className={styles['reaction__left']}>
              <div className={styles['reaction__title']}>
                {tag.entry.title}
                {currentPlayer === post.id && tag.startTime <= currentTime && currentTime <= tag.endTime && <Chip className={styles['reaction__playing']} label='Playing' size='small' />}
              </div>

              <div className={styles['reaction__description']}>
                {tag.getDetailDescription()}

                <span className={styles['reaction__extra']}>
                  , {tag.getDetailExtra()}
                </span>
              </div>
            </div>

            <div className={styles['reaction__right']}>
              <Tooltip title="Skip to reaction">
                <IconButton
                  size='small'
                  aria-label="skip to reaction"
                  className={styles['reaction__skip']}
                  onClick={() => onSkip(tag.startTime)}
                >
                  <PlayArrowIcon />
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
          </li>)}
        </ul>
      </AccordionDetails>
    </Accordion>

    <Menu
      onClose={onClose}
      anchorEl={anchorEl}
      open={anchorOpened}
      PaperProps={{
        elevation: 0,
        sx: {
          mt: 1.5,
          overflow: 'visible',
          filter: 'drop-shadow(0px 0px 8px rgba(0,0,0,0.2))',
          '& .MuiAvatar-root': {
            width: 32,
            height: 32,
            ml: -0.5,
            mr: 1,
          },
          '& .MuiMenuItem-root': {
            fontSize: 14,
            display: 'flex',
            alignItems: 'center'
          },
          '&:before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            right: 14,
            width: 10,
            height: 10,
            bgcolor: 'background.paper',
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 0,
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <MenuItem className={styles['popover-item']} onClick={() => { (selectedTag?.entry as Anime).openMAL(); onClose(); }}><img className={styles['popover-icon']} src={chrome.runtime.getURL('./images/platforms/mal.png')} alt="MAL icon" /> View on MyAnimeList <OpenInNewIcon /></MenuItem>
      <MenuItem className={styles['popover-item']} onClick={() => { (selectedTag?.entry as Anime).openAniList(); onClose(); }}><img className={styles['popover-icon']} src={chrome.runtime.getURL('./images/platforms/anilist.png')} alt="AniList icon" /> View on AniList <OpenInNewIcon /></MenuItem>
      <MenuItem className={styles['popover-item']} onClick={() => { (selectedTag?.entry as Anime).openKitsu(); onClose(); }}><img className={styles['popover-icon']} src={chrome.runtime.getURL('./images/platforms/kitsu.png')} alt="Kitsu icon" /> View on Kitsu <OpenInNewIcon /></MenuItem>
      <MenuItem className={styles['popover-item']} onClick={() => { selectedTag?.entry.openIMDb(); onClose(); }}><img className={styles['popover-icon']} src={chrome.runtime.getURL('./images/platforms/imdb.png')} alt="IMDb icon" /> View on IMDb <OpenInNewIcon /></MenuItem>
    </Menu>
  </>
}

export default PostDetail;