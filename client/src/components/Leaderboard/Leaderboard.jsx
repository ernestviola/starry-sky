import { useEffect, useState } from 'react';
import styles from './leaderboard.module.css';

const Leaderboard = ({ ref, leaderboardId }) => {
  const [globalLoading, setGlobalLoading] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);

  useEffect(() => {
    // load global scores
    const load = async () => {
      await loadGlobal();
    };

    load();
  }, []);

  const loadGlobal = async (page, leaderboardId) => {
    setGlobalLoading(true);

    try {
      const url = new URL(
        `${import.meta.env.VITE_STAR_API}api/game/leaderboard/global`,
      );
      const response = await fetch(url.toString(), {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Problems starting the game, please retry.');
      }
    } catch (error) {
    } finally {
      setGlobalLoading(false);
    }
  };

  const loadLocal = async (page) => {
    setLocalLoading(true);
    try {
      const url = new URL(
        `${import.meta.env.VITE_STAR_API}api/game/leaderboard/local`,
      );
      const response = await fetch(url.toString(), {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Problems starting the game, please retry.');
      }
    } catch (error) {
    } finally {
      setLocalLoading(false);
    }
  };

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
