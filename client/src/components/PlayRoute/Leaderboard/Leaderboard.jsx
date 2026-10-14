import { useCallback, useEffect, useRef, useState } from 'react';
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
  starting = false,
  startError,
}) => {
  const [globalLoading, setGlobalLoading] = useState(true);
  const requestRef = useRef(null);
  const [globalError, setGlobalError] = useState(false);

  const [globalLeaderboardData, setGlobalLeaderboardData] = useState({
    leaderboard: [],
    page: 1,
  });

  const loadGlobal = useCallback(async (page, leaderboardId) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
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
        method: 'GET', signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('Problems starting the game, please retry.');
      }

      const data = await response.json();
      if (!controller.signal.aborted) setGlobalLeaderboardData(data);
    } catch {
      if (!controller.signal.aborted) setGlobalError(true);
    } finally {
      if (!controller.signal.aborted) setGlobalLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGlobal(null, leaderboardId);
    return () => requestRef.current?.abort();
  }, [leaderboardId, loadGlobal]);

  return (
    <Dialog
      ref={ref}
      className={styles.leaderboard}
      aria-labelledby='leaderboard-title'
      aria-busy={globalLoading || starting}
    >
      <h1 id='leaderboard-title'>Leaderboard</h1>
      <div className={styles.rankingViewport}>
        <div className={styles.rankings}>
          <div className={styles.header}>
            <h3>Rank</h3>
            <h3>Name</h3>
            <h3>Time</h3>
          </div>
          {globalLeaderboardData.leaderboard.map((entry) => (
            <div
              className={`${styles.row} ${leaderboardId === entry.id ? styles.active : ''}`}
              key={entry.id}
            >
              <span>{entry.rank}</span>
              <span>{entry.name}</span>
              <span>{(entry.totalTimeMiliseconds / 1000).toFixed(2)}s</span>
            </div>
          ))}
        </div>
        {globalLoading && <p className={styles.feedback} role='status'>Loading leaderboard…</p>}
        {(globalError || startError) && (
          <div className={styles.feedback}>
            <p className={styles.error} role='alert'>{startError || 'Unable to load leaderboard.'}</p>
            {globalError && <button type='button' className={styles.retry} onClick={() => loadGlobal(globalLeaderboardData.page, leaderboardId)}>Reload leaderboard</button>}
          </div>
        )}
      </div>
      <div className={styles.footer}>
        <div className={styles.pager}>
          <button
            type='button'
            aria-label='Previous page'
            disabled={globalLoading || starting || globalLeaderboardData.page === 1}
            onClick={() => loadGlobal(globalLeaderboardData.page - 1, null)}
          >
            <BiLeftArrow size={16} className={styles.outlineIcon} />
            <BiSolidLeftArrow size={16} className={styles.filledIcon} />
          </button>
          <div>{globalLeaderboardData.page}</div>
          <button
            type='button'
            aria-label='Next page'
            disabled={globalLoading || starting || !globalLeaderboardData.hasNext}
            onClick={() => loadGlobal(globalLeaderboardData.page + 1, null)}
          >
            <BiRightArrow size={16} className={styles.outlineIcon} />
            <BiSolidRightArrow size={16} className={styles.filledIcon} />
          </button>
        </div>
        <button
          type='button'
          className={styles.retry}
          title='retry'
          disabled={starting || globalLoading}
          onClick={handleStartGame}
        >
          {starting ? 'Starting…' : 'Play again'} <BiRefresh size={16} className={styles.icon} />
        </button>
      </div>
    </Dialog>
  );
};

export default Leaderboard;
