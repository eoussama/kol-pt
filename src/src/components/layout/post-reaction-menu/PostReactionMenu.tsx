import styles from './PostReactionMenu.module.scss';

import { useContext } from 'react';
import { Menu, MenuItem } from '@mui/material';
import { Anime } from '../../../core/models/anime.model';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { ReactionMenuContext } from '../../../context/ReactionMenuContext';



/**
 * @description
 * Renders a popover menu for a post reaction.
 * 
 * @param props The component props.
 */
function PostReactionMenu(): JSX.Element {
  const { tag, anchorEl, anchorOpened, setAnchorOpened } = useContext(ReactionMenuContext);

  /**
   * @description
   * Closes the menu element
   */
  const onClose = () => {
    setAnchorOpened(false);
  };

  return <>
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
      <MenuItem className={styles['popover-item']} onClick={() => { (tag?.entry as Anime).openMAL(); onClose(); }}><img className={styles['popover-icon']} src={chrome.runtime.getURL('./images/platforms/mal.png')} alt="MAL icon" /> View on MyAnimeList <OpenInNewIcon /></MenuItem>
      <MenuItem className={styles['popover-item']} onClick={() => { (tag?.entry as Anime).openAniList(); onClose(); }}><img className={styles['popover-icon']} src={chrome.runtime.getURL('./images/platforms/anilist.png')} alt="AniList icon" /> View on AniList <OpenInNewIcon /></MenuItem>
      <MenuItem className={styles['popover-item']} onClick={() => { (tag?.entry as Anime).openKitsu(); onClose(); }}><img className={styles['popover-icon']} src={chrome.runtime.getURL('./images/platforms/kitsu.png')} alt="Kitsu icon" /> View on Kitsu <OpenInNewIcon /></MenuItem>
      <MenuItem className={styles['popover-item']} onClick={() => { tag?.entry.openIMDb(); onClose(); }}><img className={styles['popover-icon']} src={chrome.runtime.getURL('./images/platforms/imdb.png')} alt="IMDb icon" /> View on IMDb <OpenInNewIcon /></MenuItem>
    </Menu>
  </>
}

export default PostReactionMenu;