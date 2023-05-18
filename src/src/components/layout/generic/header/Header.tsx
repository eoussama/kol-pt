import styles from './Header.module.scss';

import { useMemo, useState } from 'react';
import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth';
import { Page } from '../../../../core/enums/page.enum';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePostStore } from '../../../../state/posts.state';
import { IconButton, Tab, Tabs, Tooltip } from '@mui/material';
import { NavigationHelper } from '../../../../core/helpers/navigator/navigation.helper';



/**
 * @description
 * The Header component renders the application's header, including the logo and title,
 * and provides the user with the ability to open the Patreon page in a new tab.
 * 
 * @returns {JSX.Element} The JSX representation of the component.
 */
function Header(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const { loadPosts } = usePostStore();
  const [value, setValue] = useState(0);
  const [email, setEmail] = useState('');
  const [photo, setPhoto] = useState('./icons/icon128x128.png');

  /**
   * @description
   * Memorizes the current route
   */
  const route = useMemo(() => {
    const path = location.pathname ?? '';
    const frags = path.split('/') ?? [];
    const sanitizedFrags = frags.filter(e => e.trim().length > 0);

    return sanitizedFrags[0];
  }, [location.pathname]);

  /**
   * @description
   * Condition to show/hide the tabs
   */
  const canShowTabs = useMemo(() => [Page.Feed, Page.Entries].includes(route as Page), [route]);

  /**
   * @description
   * Handles the click event of the logo image to refresh the post list.
   */
  const onRefresh = () => {
    const provider = new GoogleAuthProvider();
    const auth = getAuth();

    signInWithPopup(auth, provider).then(e => {
      setEmail(e.user.email ?? '');
      setPhoto(e.user.photoURL ?? '');

      console.log({ e });
    });

    loadPosts(false);
  }

  /**
   * @description
   * Handles navigation change on the tabs
   *
   * @param tab The new tab index
   */
  const onNavigate = (_: React.SyntheticEvent, tab: number) => {
    setValue(tab);
  };

  /**
   * @description
   * Handles page redirects
   *
   * @param event The mouse clock event object
   * @param page The target page
   */
  const onTabClick = (event: React.MouseEvent, page: Page) => {
    event.preventDefault();
    navigate(page);
  }

  return (
    <>
      <header className={styles['header']}>
        <div className={styles['header__branding']}>
          <div className={styles['header__logo-wrapper']}>
            <img className={styles['header__logo']} src={photo} alt="KOL PT Logo" onClick={onRefresh} />
          </div>

          <div className={styles['header__info']}>
            <h1 className={styles['header__title']}>KOL PT</h1>
            <h2 className={styles['header__subtitle']}>{email}</h2>
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

      {canShowTabs && <nav>
        <Tabs
          value={value}
          variant='fullWidth'
          onChange={onNavigate}
          aria-label="Main navigation tabs"
        >
          <Tab label="Feed" onClick={e => onTabClick(e, Page.Feed)} />
          <Tab label="Entries" onClick={e => onTabClick(e, Page.Entries)} />
        </Tabs>
      </nav>}
    </>
  );
}

export default Header;