import styles from './PostDetail.module.scss';

import { useState } from 'react';
import { Post } from '../../../core/models/post.model';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import { AccordionDetails, AccordionSummary, styled } from '@mui/material';



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
            <div className={styles['reaction__title']}>
              {tag.entry.title}
            </div>

            <div className={styles['reaction__description']}>
              {tag.getDetailDescription()}

              <span className={styles['reaction__extra']}>
                , {tag.getDetailExtra()}
              </span>
            </div>
          </li>)}
        </ul>
      </AccordionDetails>
    </Accordion>
  </>
}

export default PostDetail;