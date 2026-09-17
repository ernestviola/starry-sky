import Dialog from '../Dialog/Dialog.jsx';
import dialogStyles from '../Dialog/dialog.module.css';
import styles from './gameStart.module.css';

const GameStart = ({ dialogGameStartRef, onHowToPlay, handleStartGame }) => {
  return (
    <Dialog ref={dialogGameStartRef} className={styles.gameStart}>
      <div className={styles.startGame}>
        <h1>Find The Stars!</h1>
        <p>
          Use the map to search for Sirius and Polaris and get a final time.
        </p>
        <button className={dialogStyles.submitButton} onClick={handleStartGame}>
          Start
        </button>
        <button className={styles.secondaryButton} onClick={onHowToPlay}>
          How to play
        </button>
      </div>
    </Dialog>
  );
};

export default GameStart;
