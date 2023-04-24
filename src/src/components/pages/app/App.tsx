import styles from './App.module.scss';

import Feed from '../feed/Feed';
import Header from '../../layout/header/Header';



function App() {
  return (
    <main className={styles['root']}>
      <Header />
      <Feed />
    </main>
  );
}

export default App;
