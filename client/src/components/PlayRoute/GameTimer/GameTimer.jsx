import { useEffect, useState } from 'react';
import styles from './gameTimer.module.css';

const GameTimer = ({ startTime, totalTime }) => {
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

  if (totalTime) {
    return (
      <div role='timer' className={styles.timer}>
        Time: {(totalTime / 1000).toFixed(2)}s
      </div>
    );
  }

  if (startTime) {
    return (
      <div role='timer' className={styles.timer}>
        Time: {currentTime}
      </div>
    );
  }
};

export default GameTimer;
