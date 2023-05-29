import styles from './PostReactions.module.scss';

import CloseIcon from '@mui/icons-material/Close';
import EntryPage from '../../../pages/entry/EntryPage';
import { useContext, useEffect, useState } from 'react';
import PostReaction from '../post-reaction/PostReaction';
import { usePlayer } from '../../../../hooks/player.hook';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAuthStore } from '../../../../state/auth.state';
import { PostContext } from '../../../../context/PostContext';
import { PostAccordion } from '../post-accordion/PostAccordion';
import PostReactionMenu from '../post-reaction-menu/PostReactionMenu';
import { IconHelper } from '../../../../core/helpers/asset/icon.helper';
import { ReactionOverlayContext } from '../../../../context/ReactionOverlayContext';
import { NavigationHelper } from '../../../../core/helpers/navigator/navigation.helper';
import { AccordionDetails, AccordionSummary, Alert, Collapse, Dialog, DialogContent, DialogTitle, IconButton, Tooltip } from '@mui/material';



/**
 * @description
 * Component that renders all reactions for a post
 */
function PostReactions(): JSX.Element {
  const { post } = useContext(PostContext);
  const { player } = usePlayer(post.id);
  const user = useAuthStore(e => e.user);
  const [alertOpen, setAlertOpen] = useState(false);
  const [expanded, setExpanded] = useState<boolean>(true);
  const { tag, dialogOpened, setDialogOpened } = useContext(ReactionOverlayContext);

  /**
   * @description
   * Checks if user is logged in
   */
  const isLoggedIn = () => {
    return Boolean(user);
  }

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
   * Closes the dialog
   */
  const onClose = () => {
    setDialogOpened(false);
  };

  /**
   * @description
   * Opens the Passione channel
   *
   * @param e The mouse click event object
   */
  const onPassioneOpen = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    e.preventDefault();

    NavigationHelper.openPassione();
  }

  /* eslint-disable react-hooks/exhaustive-deps */
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

  useEffect(() => {
    setAlertOpen(!isLoggedIn());
  }, [user?.uid]);

  return <>

    <div className={styles['post__auth']}>
      <Collapse in={alertOpen}>
        <Alert
          severity='info'
          sx={{ mb: 2 }}
          action={
            <IconButton
              size="small"
              aria-label="Login in notice"
              onClick={() => setAlertOpen(false)}
            >
              <CloseIcon />
            </IconButton>
          }
        >
          <Tooltip
            title='Open the KOL PT extension popup and login to enable progress tracking'
          >
            <span className={styles['post__login']}>Login to KOL PT</span>
          </Tooltip>
          in order to track your progress.
        </Alert>
      </Collapse>
    </div>

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
              onClick={onPassioneOpen}
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

    <Dialog
      scroll='paper'
      open={dialogOpened}
      className={styles['post__dialog']}
    >
      <DialogTitle>
        Reaction Info

        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className={styles['post__dialog-content']}>
        <EntryPage entryId={tag?.entry.id ?? ''} />
      </DialogContent>
    </Dialog>
  </>
}

export default PostReactions;