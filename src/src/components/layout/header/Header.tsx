import styles from './Header.module.scss';

import { config } from '../../../config/env';
import { IconButton, Tooltip } from '@mui/material';
import { usePostStore } from '../../../state/posts.state';



/**
 * @description
 * The Header component renders the application's header, including the logo and title,
 * and provides the user with the ability to open the Patreon page in a new tab.
 * 
 * @returns {JSX.Element} The JSX representation of the component.
 */
function Header(): JSX.Element {
  const { loadPosts } = usePostStore();

  /**
   * @description
   * Handles the click event of the logo image to refresh the post list.
   */
  const onRefresh = () => {
    loadPosts(false);
  }

  /**
   * @description
   * Opens the creator's Patreon page
   */
  const onPatreonOpen = () => {
    window.open(`${config.patreonUrl}/${config.creatorName}`, '_blank');
  }

  return (
    <header className={styles['header']}>
      <div className={styles['header__branding']}>
        <div className={styles['header__logo-wrapper']}>
          <img className={styles['header__logo']} src="./icons/icon128x128.png" alt="KOL PT Logo" onClick={onRefresh} />
        </div>

        <div className={styles['header__info']}>
          <h2 className={styles['header__subtitle']}>KOL PT</h2>
          <h1 className={styles['header__title']}>Feed</h1>
        </div>
      </div>
      <div className={styles['header__actions']}>
        <Tooltip title="Open Patreon">
          <IconButton
            aria-label="Open Patreon"
            onClick={onPatreonOpen}
            className={styles['header__button']}
          >
            <img src="./images/platforms/patreon.png" alt="Patreon icon" />
          </IconButton>
        </Tooltip>
      </div>
    </header>
  );
}

export default Header;