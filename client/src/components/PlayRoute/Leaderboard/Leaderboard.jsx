import { useEffect, useState } from 'react';
import Dialog from '../Dialog/Dialog.jsx';
import styles from './leaderboard.module.css';
import {
  BiLeftArrow,
  BiRefresh,
  BiRightArrow,
  BiSolidLeftArrow,
  BiSolidRightArrow,
} from 'react-icons/bi';

const Leaderboard = ({
  ref,
  leaderboardId,
  handleStartGame,
  refreshLeaderboard,
  setRefreshLeaderboard,
}) => {
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState(false);

  const [globalLeaderboardData, setGlobalLeaderboardData] = useState({
    leaderboard: [],
    page: 1,
  });

  useEffect(() => {
    // load global scores
    const load = async () => {
      await loadGlobal(null, leaderboardId);
    };

    load();
    setRefreshLeaderboard(false);
  }, [refreshLeaderboard]);

  const loadGlobal = async (page, leaderboardId) => {
    setGlobalLoading(true);
    setGlobalError(false);

    try {
      const url = new URL(
        `${import.meta.env.VITE_STAR_API}api/game/leaderboard/global`,
      );
      if (page) {
        url.searchParams.set('page', page);
      }
      if (leaderboardId) {
        url.searchParams.set('leaderboardId', leaderboardId);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Problems starting the game, please retry.');
      }

      const data = await response.json();
      setGlobalLeaderboardData(data);
    } catch (error) {
      setGlobalError(true);
    } finally {
      setGlobalLoading(false);
    }
  };

  const loadLocal = async (page, leaderboardId) => {
    setGlobalLoading(true);
    setGlobalError(false);

    try {
      const url = new URL(
        `${import.meta.env.VITE_STAR_API}api/game/leaderboard/local`,
      );
      const response = await fetch(url.toString(), {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Problems starting the game, please retry.');
      }

      const data = await response.json();
      setGlobalLeaderboardData(data);
    } catch (error) {
      setGlobalError(true);
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <Dialog
      ref={ref}
      className={styles.leaderboard}
      aria-labelledby='leaderboard-title'
    >
      <h1 id='leaderboard-title'>Leaderboard</h1>
      <div className={styles.header}>
        <h3>Rank</h3>
        <h3>Name</h3>
        <h3>Time</h3>
      </div>
      <div className={styles.rankings}>
        {globalError && (
          <p className={styles.error} role="alert">
            Unable to load leaderboard.
          </p>
        )}

        {globalLeaderboardData.leaderboard.map((entry) => {
          return (
            <div
              className={`${styles.row} ${leaderboardId === entry.id ? styles.active : ''}`}
              key={entry.id}
            >
              <span>{entry.rank}</span>
              <span>{entry.name}</span>
              <span>{(entry.totalTimeMiliseconds / 1000).toFixed(2)}s</span>
            </div>
          );
        })}
      </div>
      <div className={styles.pager}>
        <button
          type='button'
          aria-label='Previous page'
          disabled={globalLeaderboardData.page === 1}
          onClick={() => {
            loadGlobal(globalLeaderboardData.page - 1, null);
          }}
        >
          <BiLeftArrow className={styles.outlineIcon} />
          <BiSolidLeftArrow className={styles.filledIcon} />
        </button>
        <div>{globalLeaderboardData.page}</div>
        <button
          type='button'
          aria-label='Next page'
          disabled={!globalLeaderboardData.hasNext}
          onClick={() => {
            loadGlobal(globalLeaderboardData.page + 1, null);
          }}
        >
          <BiRightArrow className={styles.outlineIcon} />
          <BiSolidRightArrow className={styles.filledIcon} />
        </button>
      </div>

      <button
        type='button'
        className={styles.retry}
        title='retry'
        onClick={handleStartGame}
      >
        Retry <BiRefresh className={styles.icon} />
      </button>
    </Dialog>
  );
};

export default Leaderboard;
