import Dialog from '../Dialog/Dialog.jsx';
import dialogStyles from '../Dialog/dialog.module.css';
import styles from './gameStart.module.css';

const GameStart = ({ dialogGameStartRef, onHowToPlay, handleStartGame, loading, error }) => {
  return (
    <Dialog ref={dialogGameStartRef} className={styles.gameStart} aria-labelledby='game-start-title' aria-busy={loading}>
      <div className={styles.startGame}>
        <h1 id='game-start-title'>Find the stars!</h1>
        <p>
          Use the map to search for Sirius and Polaris and get a final time.
        </p>
        {error && <p className={dialogStyles.error} role='alert'>{error}</p>}
        <button className={dialogStyles.submitButton} onClick={handleStartGame} disabled={loading}>
          Start
        </button>
        <button className={styles.secondaryButton} onClick={onHowToPlay} disabled={loading}>
          How to play
        </button>
      </div>
    </Dialog>
  );
};

export default GameStart;
