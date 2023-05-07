import styles from './Header.module.scss';

import { config } from '../../../config/env';
import { IconButton, Tooltip } from '@mui/material';
import { usePostStore } from '../../../state/posts.state';
import BugReportIcon from '@mui/icons-material/BugReport';



/**
 * @description
 * The Header component renders the application's header, including the logo and title,
 * and provides the user with the ability to open the Patreon page in a new tab.
 * 
 * @returns {JSX.Element} The JSX representation of the component.
 */
function Header(): JSX.Element {
  const { loadPosts } = usePostStore();
  const projectUrl = 'https://github.com/EOussama/kol-pt';

  /**
   * @description
   * Handles the click event of the logo image to refresh the post list.
   */
  const onRefresh = () => {
    loadPosts(false);
  }

  /**
   * @description
   * Opens the bug report page
   */
  const onBugOpen = () => {
    window.open(`${projectUrl}/issues/new?assignees=EOussama&labels=%F0%9F%AA%B2+Bug&template=bug_report.md&title=`, '_blank');
  }

  /**
   * @description
   * Opens the project's Github page
   */
  const onProjectOpen = () => {
    window.open(projectUrl, '_blank');
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
        <Tooltip title="Report bug">
          <IconButton
            aria-label="Opens the bug reporting issue"
            onClick={onBugOpen}
            className={`${styles['header__button']} ${styles['header__button--bug']}`}
          >
            <BugReportIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Project page">
          <IconButton
            aria-label="Opens project's Github page"
            onClick={onProjectOpen}
            className={`${styles['header__button']} ${styles['header__button--project']}`}
          >
            <img src="./images/platforms/github.png" alt="Github icon" />
          </IconButton>
        </Tooltip>

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