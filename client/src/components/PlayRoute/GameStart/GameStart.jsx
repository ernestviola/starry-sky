import shared from '../shared.module.css';
import styles from './gameStart.module.css';

const GameStart = ({ dialogGameStartRef, handleStartGame }) => {
  return (
    <dialog
      ref={dialogGameStartRef}
      className={`${shared.dialog} ${styles.gameStart}`}
      onCancel={(e) => e.preventDefault()}
    >
      <div className={styles.startGame}>
        <h1>Find The Stars!</h1>
        <p>
          Use the map to search for Sirius and Polaris and get a final time.
        </p>
        <button className={shared.submitButton} onClick={handleStartGame}>
          Start
        </button>
        <button
          className={styles.secondaryButton}
          onClick={() => dialogHowToPlayRef.current?.show()}
        >
          How to play
        </button>
      </div>
    </dialog>
  );
};

export default GameStart;
