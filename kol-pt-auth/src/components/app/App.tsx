import styles from './App.module.scss';



function App() {
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
          Google Authentication for <b>KOL PT (Patreon Tracker)</b>
        </div>
      </div>
    </>
  );
}

export default App;
