import { useRef, useState, useEffect } from 'react';
import StarMap from '../components/StarMap/index.jsx';
import { jwtDecode } from 'jwt-decode';
import GameTimer from '../components/GameTimer.jsx';

const Play = () => {
  const [loading, setLoading] = useState(false);
  const [hoveredStarId, setHoveredStarId] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameToken, setGameToken] = useState(null);
  const [starsFoundDictionary, setStarsFoundDictionary] = useState({});

  const [gameStartTime, setGameStartTime] = useState(null);
  const [gameTotalTime, setGameTotalTime] = useState(null);

  const hoveredStarIdRef = useRef();

  const dialogRef = useRef();

  const dialogStyle = {
    textAlign: 'center',
    backgroundColor: 'black',
    color: 'white',
    zIndex: 1,
  };

  useEffect(() => {
    dialogRef.current.showModal();
  }, []);

  useEffect(() => {
    hoveredStarIdRef.current = hoveredStarId;
  }, [hoveredStarId]);

  const handleStartGame = async () => {
    try {
      setLoading(true);
      const url = new URL(`${import.meta.env.VITE_STAR_API}api/game/start`);
      const response = await fetch(url.toString(), {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Problems starting the game, please retry');
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
      dialogRef.current.close();
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
        console.log('Submit');

        const url = new URL(`${import.meta.env.VITE_STAR_API}api/game/submit`);
        const response = await fetch(url.toString(), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${gameToken}`,
          },
        });

        const data = await response.json();
        const timeInSeconds = data.totalTime / 1000;

        setGameTotalTime(data.totalTime);

        console.log(`${timeInSeconds.toFixed(2)}s`);
      }
    }

    handleStarsFound();
  }, [starsFoundDictionary]);

  return (
    <div style={{ position: 'relative' }}>
      <dialog ref={dialogRef} style={dialogStyle}>
        <h1>Use the map to find Sirius and Polaris and submit your score</h1>
        <button onClick={handleStartGame}>Start</button>
      </dialog>
      <StarMap
        hoveredStarId={hoveredStarId}
        setHoveredStarId={setHoveredStarId}
        handleClick={handleStarClick}
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
