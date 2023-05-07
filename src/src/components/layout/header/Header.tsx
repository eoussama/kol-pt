import styles from './Header.module.scss';

import { IconButton, Tooltip } from '@mui/material';
import { usePostStore } from '../../../state/posts.state';
import { NavigationHelper } from '../../../core/helpers/navigator/navigation.helper';



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
        <Tooltip title="Project Page">
          <IconButton
            aria-label="Opens project's Github page"
            onClick={NavigationHelper.openProject}
            className={`${styles['header__button']} ${styles['header__button--project']}`}
          >
            <img src="./images/platforms/github.png" alt="Github icon" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Open Discord">
          <IconButton
            aria-label="Opens KOl's Discord server"
            onClick={NavigationHelper.openDiscord}
            className={`${styles['header__button']} ${styles['header__button--discord']}`}
          >
            <img src="./images/platforms/discord.png" alt="Discord icon" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Open Patreon">
          <IconButton
            aria-label="Open Patreon"
            onClick={NavigationHelper.openPatreon}
            className={`${styles['header__button']} ${styles['header__button--patreon']}`}
          >
            <img src="./images/platforms/patreon.png" alt="Patreon icon" />
          </IconButton>
        </Tooltip>
      </div>
    </header>
  );
}

export default Header;