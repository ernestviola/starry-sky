import { useRef, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useStarMap } from '../../contexts/StarMapContext.jsx';
import GameTimer from '../../components/PlayRoute/GameTimer/GameTimer.jsx';
import Leaderboard from '../../components/PlayRoute/Leaderboard/Leaderboard.jsx';
import SearchList from '../../components/SearchList/SearchList.jsx';
import HowToPlay from '../../components/PlayRoute/HowToPlay/HowToPlay.jsx';
import styles from './play.module.css';
import GameStart from '../../components/PlayRoute/GameStart/GameStart.jsx';
import SubmitScore from '../../components/PlayRoute/SubmitScore/SubmitScore.jsx';
import shared from '../../components/PlayRoute/shared.module.css';

const Play = () => {
  const [loading, setLoading] = useState(false);
  const { hoveredStarId, registerClickHandler } = useStarMap();
  const [gameStartTime, setGameStartTime] = useState(null);
  const [gameTotalTime, setGameTotalTime] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameToken, setGameToken] = useState(null);
  const [gameFinishedToken, setGameFinishedToken] = useState(null);
  const [name, setName] = useState('');
  const [leaderboardId, setLeaderboardId] = useState(null);
  const [refreshLeaderboard, setRefreshLeaderboard] = useState(false);

  const [starsFoundDictionary, setStarsFoundDictionary] = useState({});

  const hoveredStarIdRef = useRef();

  const dialogGameStartRef = useRef();
  const dialogSubmitScoreRef = useRef();
  const dialogLeaderboardRef = useRef();
  const dialogHowToPlayRef = useRef();

  useEffect(() => {
    const preventEscape = (event) => {
      if (
        event.key === 'Escape' &&
        (dialogGameStartRef.current?.open ||
          dialogSubmitScoreRef.current?.open ||
          dialogLeaderboardRef.current?.open)
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('keydown', preventEscape, true);

    return () => {
      window.removeEventListener('keydown', preventEscape, true);
    };
  }, []);

  useEffect(() => {
    dialogGameStartRef.current.show();
    // dialogLeaderboardRef.current.showModal();
  }, []);

  useEffect(() => {
    hoveredStarIdRef.current = hoveredStarId;
  }, [hoveredStarId]);

  const handleStartGame = async () => {
    try {
      setLoading(true);
      setGameTotalTime(null);
      setGameFinishedToken(null);
      const url = new URL(`${import.meta.env.VITE_STAR_API}api/game/start`);
      const response = await fetch(url.toString(), {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Problems starting the game, please retry.');
      }

      const data = await response.json();
      setGameToken(data.token);

      const decoded = jwtDecode(data.token);

      setGameStartTime(decoded.startTime);

      const starsDictionary = {};
      for (const star of decoded.starsToFind) {
        starsDictionary[star.id] = {
          name: star.proper,
          found: false,
        };
      }

      setStarsFoundDictionary(starsDictionary);
      closeDialog(dialogGameStartRef);
      dialogLeaderboardRef.current.close();
      dialogSubmitScoreRef.current.close();

      setGameStarted(true);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const checkAllStarsFound = () => {
    return (
      Object.values(starsFoundDictionary).filter((star) => !star.found) >= 0
    );
  };

  const handleStarClick = () => {
    const starId = hoveredStarIdRef.current;

    if (starId !== null && starsFoundDictionary[starId] !== undefined) {
      setStarsFoundDictionary((prev) => {
        const starToUpdate = prev[starId];
        starToUpdate.found = true;
        const foundStars = { ...prev, [starId]: starToUpdate };
        return foundStars;
      });
    }
  };

  useEffect(() => {
    return registerClickHandler(handleStarClick);
  }, [registerClickHandler, handleStarClick]);

  useEffect(() => {
    async function handleStarsFound() {
      if (checkAllStarsFound() && gameStarted) {
        const url = new URL(`${import.meta.env.VITE_STAR_API}api/game/submit`);
        const response = await fetch(url.toString(), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${gameToken}`,
          },
        });

        const data = await response.json();
        const decoded = jwtDecode(data.token);

        setGameTotalTime(decoded.totalTime);
        setGameFinishedToken(data.token);
        dialogSubmitScoreRef.current.show();
      }
    }

    handleStarsFound();
  }, [starsFoundDictionary]);

  const handleSubmitName = async (e) => {
    e.preventDefault();

    if (!gameFinishedToken) return;

    function geolocationPromise() {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported.'));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            return;
          },
          (error) => {
            reject(new Error(error));
          },
        );
      });
    }

    let latitude, longitude;

    try {
      const position = await geolocationPromise();
      latitude = position.latitude;
      longitude = position.longitude;
    } catch (error) {
      console.log(error);
    }

    try {
      const url = new URL(
        `${import.meta.env.VITE_STAR_API}api/game/submit/name`,
      );
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${gameFinishedToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
          name,
        }),
      });

      if (!response.ok) {
        throw new Error('Issues submitting the score, try again.');
      }

      const data = await response.json();

      if (data.success) {
        // show the leaderboard and the users position
        setLeaderboardId(data.leaderboardId);

        // close the dialog

        closeDialog(dialogSubmitScoreRef);
        dialogLeaderboardRef.current.show();
        setRefreshLeaderboard(true);
        // show the leaderboard modal
      }
    } catch (error) {
      console.log(error);
    }
  };

  const closeDialog = (ref) => {
    const dialog = ref.current;

    dialog.classList.add(shared.closing);

    dialog.addEventListener(
      'animationend',
      () => {
        dialog.close();
        dialog.classList.remove(shared.closing);
      },
      { once: true },
    );
  };

  return (
    <div className={styles.play}>
      <title>Play | Starry Sky</title>

      <GameStart
        dialogGameStartRef={dialogGameStartRef}
        handleStartGame={handleStartGame}
      />

      <dialog
        ref={dialogHowToPlayRef}
        className={styles.dialog}
        onCancel={(e) => e.preventDefault()}
      >
        <HowToPlay onClose={() => dialogHowToPlayRef.current?.close()} />
      </dialog>
      <SubmitScore
        dialogSubmitScoreRef={dialogSubmitScoreRef}
        handleSubmitName={handleSubmitName}
        setName={setName}
        gameTotalTime={gameTotalTime}
      />

      <Leaderboard
        ref={dialogLeaderboardRef}
        leaderboardId={leaderboardId}
        handleStartGame={handleStartGame}
        refreshLeaderboard={refreshLeaderboard}
        setRefreshLeaderboard={setRefreshLeaderboard}
      />
      {gameStarted && (
        <div className={styles.gameStatus}>
          <GameTimer startTime={gameStartTime} totalTime={gameTotalTime} />
          <SearchList items={starsFoundDictionary} />
        </div>
      )}
    </div>
  );
};

export default Play;
