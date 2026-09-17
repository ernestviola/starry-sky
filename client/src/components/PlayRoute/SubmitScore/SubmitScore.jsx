import shared from '../shared.module.css';
import styles from './SubmitScore.module.css';

const SubmitScore = ({
  dialogSubmitScoreRef,
  handleSubmitName,
  setName,
  gameTotalTime,
}) => {
  return (
    <dialog
      ref={dialogSubmitScoreRef}
      className={shared.dialog}
      onCancel={(e) => e.preventDefault()}
    >
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
        <button className={shared.submitButton} type='submit'>
          Submit
        </button>
      </form>
    </dialog>
  );
};

export default SubmitScore;
