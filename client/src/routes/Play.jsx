import { useRef, useState, useEffect } from 'react';
import StarMap from '../components/StarMap/index.jsx';
import { jwtDecode } from 'jwt-decode';
import GameTimer from '../components/GameTimer.jsx';
import Leaderboard from '../components/Leaderboard/Leaderboard.jsx';

const Play = () => {
  const [loading, setLoading] = useState(false);
  const [hoveredStarId, setHoveredStarId] = useState(null);
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

  const dialogStyle = {
    minWidth: '400px',
    textAlign: 'center',
    backgroundColor: 'black',
    color: 'white',
    zIndex: 1,
  };

  useEffect(() => {
    dialogGameStartRef.current.showModal();
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
        starsDictionary[star.id] = false;
      }

      setStarsFoundDictionary(starsDictionary);
      dialogGameStartRef.current.close();
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
    const stillNeedToFind = Object.values(starsFoundDictionary).filter(
      (found) => {
        return found === false;
      },
    ).length;
    return stillNeedToFind <= 0;
  };

  const handleStarClick = () => {
    const starId = hoveredStarIdRef.current;

    if (starId !== null && starsFoundDictionary[starId] !== undefined) {
      setStarsFoundDictionary((prev) => {
        const foundStars = { ...prev, [starId]: true };
        return foundStars;
      });
    }
  };

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

        const timeInSeconds = decoded.totalTime / 1000;

        setGameTotalTime(decoded.totalTime);
        setGameFinishedToken(data.token);

        console.log(`${timeInSeconds.toFixed(2)}s`);
        dialogSubmitScoreRef.current.showModal();
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
        dialogSubmitScoreRef.current.close();
        dialogLeaderboardRef.current.showModal();
        setRefreshLeaderboard(true);
        // show the leaderboard modal
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <StarMap
        hoveredStarId={hoveredStarId}
        setHoveredStarId={setHoveredStarId}
        handleClick={handleStarClick}
      />

      <dialog
        ref={dialogGameStartRef}
        style={dialogStyle}
        onCancel={(e) => e.preventDefault()}
      >
        <h1>Use the map to find Sirius and Polaris and submit your score</h1>
        <button onClick={handleStartGame}>Start</button>
      </dialog>

      <dialog
        ref={dialogSubmitScoreRef}
        style={{ ...dialogStyle }}
        onCancel={(e) => e.preventDefault()}
      >
        <form
          action=''
          style={{ display: 'flex', flexDirection: 'column', gap: '1em' }}
          onSubmit={handleSubmitName}
        >
          <h1>Submit Time!</h1>
          <p style={{ fontSize: '2.4em' }}>
            {(gameTotalTime / 1000).toFixed(2)}s
          </p>
          <label htmlFor='name' style={{ fontSize: '1.6em' }}>
            <input
              type='text'
              id='name'
              placeholder='Name'
              style={{ padding: '4px 8px', outline: 'none' }}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button
            style={{ fontSize: '1.6em', width: '100px', margin: 'auto' }}
            type='submit'
          >
            Submit
          </button>
        </form>
      </dialog>
      <Leaderboard
        ref={dialogLeaderboardRef}
        leaderboardId={leaderboardId}
        handleStartGame={handleStartGame}
        refreshLeaderboard={refreshLeaderboard}
        setRefreshLeaderboard={setRefreshLeaderboard}
      />
      <GameTimer
        startTime={gameStartTime}
        totalTime={gameTotalTime}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          backgroundColor: 'black',
          color: 'white',
          fontSize: '1.6em',
          padding: '4px',
        }}
      />
    </div>
  );
};

export default Play;
