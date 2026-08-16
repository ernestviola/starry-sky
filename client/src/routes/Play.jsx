import { useRef, useState, useEffect } from 'react';
import StarMap from '../components/StarMap/index.jsx';
import { jwtDecode } from 'jwt-decode';

const Play = () => {
  const [loading, setLoading] = useState(false);
  const [hoveredStarId, setHoveredStarId] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameToken, setGameToken] = useState(null);
  const [starsFoundDictionary, setStarsFoundDictionary] = useState({});

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

      const starsDictionary = {};
      for (const star in decoded.starsToFind) {
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
    return (
      Object.keys(starsFoundDictionary).filter((found) => {
        found === false;
      }).length > 0
    );
  };
  const handleStarClick = () => {};
  return (
    <div style={{ position: 'relative' }}>
      <dialog ref={dialogRef} style={dialogStyle}>
        <h1>Use the map to find Sirius and Polaris and submit your score</h1>
        <button onClick={handleStartGame}>Start</button>
      </dialog>
      <StarMap
        hoveredStarId={hoveredStarId}
        setHoveredStarId={setHoveredStarId}
      />
    </div>
  );
};

export default Play;
