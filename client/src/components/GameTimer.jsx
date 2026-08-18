import { useEffect, useState } from 'react';

const GameTimer = ({ startTime, style }) => {
  const [currentTime, setCurrentTime] = useState(null);
  useEffect(() => {
    const currentInterval = setInterval(() => {
      // calculate the time
      const timeInMiliseconds = Date.now() - startTime;
      const timeInSeconds = timeInMiliseconds / 1000;

      setCurrentTime(`${timeInSeconds.toFixed(2)}s`);
    }, 10);

    return () => clearInterval(currentInterval);
  }, [startTime]);
  if (currentTime) {
    return <div style={style}>{currentTime}</div>;
  }
};

export default GameTimer;
