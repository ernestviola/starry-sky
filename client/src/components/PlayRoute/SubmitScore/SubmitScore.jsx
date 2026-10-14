import Dialog from '../Dialog/Dialog.jsx';
import dialogStyles from '../Dialog/dialog.module.css';
import styles from './submitScore.module.css';

const SubmitScore = ({ dialogSubmitScoreRef, handleSubmitName, setName, name,
  gameTotalTime, finishing, loading, error, onRetry }) => (
  <Dialog ref={dialogSubmitScoreRef} aria-labelledby='score-title' aria-busy={loading}>
    <form className={styles.scoreForm} onSubmit={handleSubmitName}>
      <h1 id='score-title'>Submit your time</h1>
      <p className={styles.score} aria-label={gameTotalTime == null ? 'Time pending' : undefined}>
        {gameTotalTime == null ? '—' : `${(gameTotalTime / 1000).toFixed(2)}s`}
      </p>
      <input type='text' id='score-name' name='name' placeholder='Name' aria-label='Name'
        className={styles.nameInput} value={name} maxLength={12} required
        pattern='.*\S.*' disabled={finishing || loading} autoComplete='nickname'
        onChange={event => setName(event.target.value)} />
      {error && <p className={dialogStyles.error} role='alert'>{error}</p>}
      {finishing && error ? (
        <button type='button' className={`${dialogStyles.submitButton} ${styles.submitButton}`} onClick={onRetry} disabled={loading}>
          Retry calculation
        </button>
      ) : (
        <button className={`${dialogStyles.submitButton} ${styles.submitButton}`} type='submit' disabled={finishing || loading}>
          {loading ? (finishing ? 'Calculating…' : 'Saving…') : 'Submit'}
        </button>
      )}
      <p className={styles.requestStatus} role='status'>
        {loading ? (finishing ? 'Calculating your time…' : 'Saving your score…') : ''}
      </p>
    </form>
  </Dialog>
);
export default SubmitScore;
