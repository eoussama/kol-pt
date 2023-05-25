import styles from './Header.module.scss';

import { useMemo, useState } from 'react';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../../../hooks/auth.hook';
import { Page } from '../../../../core/enums/page.enum';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePostStore } from '../../../../state/posts.state';
import { Button, IconButton, Tab, Tabs, Tooltip } from '@mui/material';
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
  const [tab, setTag] = useState(0);
  const loadPosts = usePostStore(e => e.loadPosts);
  const { photo, email, onLogin, onLogout, isLoggedIn } = useAuth();

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
    loadPosts(false);
  }

  /**
   * @description
   * Handles navigation change on the tabs
   *
   * @param tab The new tab index
   */
  const onNavigate = (_: React.SyntheticEvent, tab: number) => {
    setTag(tab);
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
      <header
        className={styles['flair']}
        onClick={NavigationHelper.openProject}
      >
        KOL PT - v0.1.0
      </header>

      <header className={styles['header']}>
        <div className={styles['header__branding']}>
          {!isLoggedIn() &&
            <Button
              size="small"
              onClick={onLogin}
              variant="outlined"
              startIcon={<LoginIcon />}
              className={styles['header__login']}
            >
              <span>Login</span>
            </Button>
          }

          {isLoggedIn() && <>
            <div className={styles['header__logo-wrapper']}>
              <img className={styles['header__logo']} src={photo} alt="KOL PT Logo" onClick={onRefresh} />
            </div>

            <div className={styles['header__info']}>
              <h1 className={styles['header__title']}>KOL PT</h1>
              <Tooltip title={email}>
                <h2 className={styles['header__subtitle']}>{email}</h2>
              </Tooltip>
            </div>
          </>
          }
        </div>

        <div className={styles['header__actions']}>
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

          {isLoggedIn() &&
            <Tooltip title="Logout">
              <IconButton
                size='small'
                onClick={onLogout}
                aria-label="logout"
                className={styles['header__logout']}
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>}
        </div>
      </header>

      {canShowTabs && <nav>
        <Tabs
          value={tab}
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