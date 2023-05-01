import styles from './PostReactions.module.scss';

import { usePlayer } from '../../../hooks/player.hook';
import { useContext, useEffect, useState } from 'react';
import PostReaction from '../post-reaction/PostReaction';
import { PostContext } from '../../../context/PostContext';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { PostAccordion } from '../post-accordion/PostAccordion';
import { AccordionDetails, AccordionSummary } from '@mui/material';
import PostReactionMenu from '../post-reaction-menu/PostReactionMenu';



/**
 * @description
 * Component that renders all reactions for a post
 */
function PostReactions(): JSX.Element {
  const { post } = useContext(PostContext);
  const { player } = usePlayer(post.id);
  const [expanded, setExpanded] = useState<boolean>(true);

  useEffect(() => {
    for (const tag of post.tags) {
      player.addCuePoint(tag.startTime, { tag });
    }
  }, []);

  /**
   * @description
   * Generates proper title for the accordion
   *
   * @param post The target post
   */
  const getReactionsTitle = () => {
    const reactionCount = post.tags.length;
    const reactionText = reactionCount > 1 ? 'reactions' : 'reaction';

    return `${reactionCount} ${reactionText}`;
  }

  return <>
    <PostAccordion
      expanded={expanded}
      className={styles['post']}
      onChange={() => setExpanded(!expanded)}
    >
      <AccordionSummary className={styles['post__head']} expandIcon={<ExpandMoreIcon />}>
        <h3 className={styles['post__title']}>{getReactionsTitle()}</h3>
      </AccordionSummary>

      <AccordionDetails className={styles['post__body']}>
        <ul className={styles['reactions']}>
          {post.tags.map(tag => <PostReaction key={tag.id} tag={tag} />)}
        </ul>
      </AccordionDetails>
    </PostAccordion>

    <PostReactionMenu />
  </>
}

export default PostReactions;