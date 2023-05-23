import styles from './App.module.scss';

import { Outlet } from 'react-router-dom';
import Header from '../../layout/generic/header/Header';



/**
 * @description
 * The root component of the application.
 * It renders the header and feed components within the main element.
 * 
 * @returns {JSX.Element} The JSX representation of the component.
 */
function App(): JSX.Element {

  return (
    <main className={styles['root']}>
      <Header />
      <Outlet />
    </main>
  );
}

export default App;
