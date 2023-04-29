import styles from './PostDetail.module.scss';

import { useState } from 'react';
import Vimeo from '@vimeo/player';
import { Post } from '../../../core/models/post.model';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import { AccordionDetails, AccordionSummary, IconButton, Tooltip, styled } from '@mui/material';



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
  const [expanded, setExpanded] = useState<boolean>(true);

  const onSkip = async (seconds: number) => {
    const video = document.querySelector(`[data-kol_pt_id="${post.id}"] iframe`) as HTMLIFrameElement;
    const player = new Vimeo(video);

    player.play();
    player.setCurrentTime(seconds);
  }

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
                <IconButton size='small' aria-label="more">
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            </div>
          </li>)}
        </ul>
      </AccordionDetails>
    </Accordion>
  </>
}

export default PostDetail;