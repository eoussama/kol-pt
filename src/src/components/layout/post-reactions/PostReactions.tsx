import styles from './PostReactions.module.scss';

import { usePlayer } from '../../../hooks/player.hook';
import { useContext, useEffect, useState } from 'react';
import PostReaction from '../post-reaction/PostReaction';
import { PostContext } from '../../../context/PostContext';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { PostAccordion } from '../post-accordion/PostAccordion';
import { IconHelper } from "../../../core/helpers/asset/icon.helper";
import PostReactionMenu from '../post-reaction-menu/PostReactionMenu';
import { NavigationHelper } from '../../../core/helpers/navigator/navigation.helper';
import { AccordionDetails, AccordionSummary, IconButton, Tooltip } from '@mui/material';



/**
 * @description
 * Component that renders all reactions for a post
 */
function PostReactions(): JSX.Element {
  const { post } = useContext(PostContext);
  const { player } = usePlayer(post.id);
  const [expanded, setExpanded] = useState<boolean>(true);

  useEffect(() => {

    // Adding cue points
    for (const tag of post.tags) {
      player.addCuePoint(tag.startTime, { tag });
    }

    // Auto playing reaction
    const urlSearch = new URLSearchParams(window.location.search);
    const reactionId = urlSearch.get('reactionId');
    const canAutoPlay = (reactionId?.length ?? 0) > 0

    if (canAutoPlay) {
      const reaction = post.tags.find(tag => tag.id === reactionId);
      player.setCurrentTime(reaction?.startTime ?? 0);
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

  /**
   * @description
   * Opens the Passione channel
   *
   * @param e The mouse click event object
   */
  const OnPassioneOpen = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    e.preventDefault();

    NavigationHelper.openPassione();
  }

  return <>
    <PostAccordion
      expanded={expanded}
      className={styles['post']}
      onChange={() => setExpanded(!expanded)}
    >
      <AccordionSummary className={styles['post__head']} expandIcon={<ExpandMoreIcon />}>
        <div className={styles['post__head-wrapper']}>
          <h3 className={styles['post__title']}>{getReactionsTitle()}</h3>

          <Tooltip title="Open Passione Club Channel">
            <IconButton
              aria-label="Opens KOl's Discord server"
              onClick={OnPassioneOpen}
              className={`${styles['post__action']} ${styles['post__action--discord']}`}
            >
              <img src={IconHelper.getIcon('discord', 'platforms')} alt="Discord icon" />
            </IconButton>
          </Tooltip>
        </div>
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