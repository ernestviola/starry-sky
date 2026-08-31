import { useEffect } from 'react';
import styles from './leaderboard.module.css';

const Leaderboard = ({ ref, leaderboardId }) => {
  useEffect(() => {
    // load local scores
    // load global scores
  }, []);

  return (
    <dialog ref={ref} className={styles.leaderboard}>
      <h1>Leaderboard</h1>
      <div className={styles.tabs}>
        <div className={styles.tab}>
          <h2>Global</h2>
        </div>
        <div className={styles.tab}>
          <h2>Local</h2>
        </div>
      </div>
      <div>
        <div>
          <h3>Name</h3>
          <h3>Time</h3>
        </div>
        <div>list of users and scores</div>
      </div>
      <div>
        <button>;leftarrow ;leftarrow </button>
        <div>page group and buttons</div>
        <button>;rightarrow ;rightarrow</button>
      </div>

      <button>Retry</button>
    </dialog>
  );
};

export default Leaderboard;
