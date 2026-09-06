import { useEffect, useState } from 'react';
import styles from './leaderboard.module.css';
import { BiLeftArrow, BiRightArrow } from 'react-icons/bi';

const Leaderboard = ({ ref, leaderboardId }) => {
  const [globalLoading, setGlobalLoading] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  const [globalLeaderboardData, setGlobalLeaderboardData] = useState({
    leaderboard: [],
    page: 1,
  });

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
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Problems starting the game, please retry.');
      }

      const data = await response.json();
      console.log(data.leaderboard);
      setGlobalLeaderboardData(data);

      console.log(data);
    } catch (error) {
    } finally {
      setGlobalLoading(false);
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
      <div className={styles.rankings}>
        <div className={styles.header}>
          <h3>Rank</h3>
          <h3>Name</h3>
          <h3>Time</h3>
        </div>

        {globalLeaderboardData.leaderboard.map((entry) => {
          return (
            <div className={styles.row} key={entry.id}>
              <span>{entry.rank}</span>
              <span>{entry.name}</span>
              <span>{(entry.totalTimeMiliseconds / 1000).toFixed(2)}s</span>
            </div>
          );
        })}
      </div>
      <div>
        <button>
          <BiLeftArrow />{' '}
        </button>
        <div>{globalLeaderboardData.page}</div>
        <button>
          <BiRightArrow />
        </button>
      </div>

      <button>Retry</button>
    </dialog>
  );
};

export default Leaderboard;
