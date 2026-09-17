import Dialog from '../Dialog/Dialog.jsx';
import dialogStyles from '../Dialog/dialog.module.css';
import styles from './submitScore.module.css';

const SubmitScore = ({
  dialogSubmitScoreRef,
  handleSubmitName,
  setName,
  gameTotalTime,
}) => {
  return (
    <Dialog ref={dialogSubmitScoreRef}>
      <form action='' className={styles.scoreForm} onSubmit={handleSubmitName}>
        <h1>Submit Time!</h1>
        <p className={styles.score}>{(gameTotalTime / 1000).toFixed(2)}s</p>
        <label className={styles.nameLabel} htmlFor='name'>
          <input
            type='text'
            id='name'
            placeholder='Name'
            className={styles.nameInput}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button className={dialogStyles.submitButton} type='submit'>
          Submit
        </button>
      </form>
    </Dialog>
  );
};

export default SubmitScore;
