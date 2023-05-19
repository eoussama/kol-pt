import { useEffect, useState } from 'react';
import { useAuthStore } from '../state/auth.state';
import { AuthHelper } from '../core/helpers/firebase/auth.helper';



/**
 * @description
 * Handles user authentication
 */
export function useAuth() {
  const [email, setEmail] = useState('');
  const [photo, setPhoto] = useState('./icons/icon128x128.png');
  const { user, login, logout } = useAuthStore();

  const isLoggedIn = () => Boolean(user);

  /**
   * @description
   * Logs user in
   */
  const onLogin = () => {
    AuthHelper.login();
  }

  /**
   * @description
   * Logs user out
   */
  const onLogout = () => {
    AuthHelper.logout();
  }

  useEffect(() => {
    setEmail(user?.email ?? '');
    setPhoto(user?.photoURL ?? './icons/icon128x128.png');
  }, [user?.uid]);

  useEffect(() => {
    AuthHelper.onChange(user => {
      if (user) {
        login(user);
      } else {
        logout();
      }
    });
  }, []);

  return { email, photo, onLogin, onLogout, isLoggedIn };
}