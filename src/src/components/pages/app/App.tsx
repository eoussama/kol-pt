import styles from './App.module.scss';

import Feed from '../feed/Feed';
import Header from '../../layout/header/Header';



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
      <Feed />
    </main>
  );
}

export default App;
