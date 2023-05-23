import styles from './App.module.scss';

import { useEffect } from 'react';
import { config } from '../../config/env';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';



/**
 * @description
 * Renders the auth component
 */
function App(): JSX.Element {

  useEffect(() => {
    if (window.opener) {
      const app = initializeApp(config);
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();

      signInWithPopup(auth, provider)
        .then(async (e: any) => {
          const token = e._tokenResponse.oauthIdToken ?? '';
          
          const payload = { token };
          const message = { type: 3, payload };

          window.opener.postMessage(message, '*');
          window.close();
        });
    }
  }, []);

  return (
    <>
      <div className={styles['content']}>
        <div className={styles['content__icon']}>
          <img
            alt="Login Icon"
            src="./images/graphs/login.png"
          />
        </div>

        <div className={styles['content__message']}>
          <p>Google Authentication for <b>KOL PT (Patreon Tracker)</b></p>
          <p className={styles['content__note']}>Make sure you're not blocking popups on this page so that the Google OAuth window is not blocked.</p>
        </div>
      </div>
    </>
  );
}

export default App;
