import { useEffect, useState } from 'react';
import { AuthHelper } from '../core/helpers/firebase/auth.helper';



/**
 * @description
 * Handles user authentication
 */
export function useAuth() {
  const [email, setEmail] = useState('');
  const [photo, setPhoto] = useState('./icons/icon128x128.png');

  /**
   * @description
   * Logs user in
   */
  const onLogin = () => {
    AuthHelper
      .login()
      .then(e => {
        setEmail(e.user.email ?? '');
        setPhoto(e.user.photoURL ?? './icons/icon128x128.png');
      });
  }

  /**
   * @description
   * Logs user out
   */
  const onLogout = () => {
    AuthHelper.logout();
  }

  useEffect(() => {
    AuthHelper.onChange(user => {
      console.log('ddd');
    });
  }, []);

  return { email, photo, onLogin, onLogout };
}