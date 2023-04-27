import styles from './Header.module.scss';

import { Button } from '@mui/material';
import { config } from '../../../config/env';
import { usePostStore } from '../../../state/posts.state';



function Header() {
  const { loadPosts } = usePostStore();

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
          <h1 className={styles['header__title']}>KOL PT</h1>
          <h2 className={styles['header__subtitle']}>Patreon Tracker</h2>
        </div>
      </div>
      <div className={styles['header__actions']}>
        <Button
          className={styles['header__button']}
          target='_blank'
          variant="outlined"
          href={`${config.patreonUrl}/${config.creatorName}`}
        >Open Patreon</Button>
      </div>
    </header>
  );
}

export default Header;