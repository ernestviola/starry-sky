import Dialog from '../Dialog/Dialog.jsx';
import styles from './howToPlay.module.css';

const HowToPlay = ({ ref, onClose }) => {
  return (
    <Dialog ref={ref} aria-labelledby='how-to-play-title'>
      <section className={styles.content}>
        <h1 id='how-to-play-title'>How to play</h1>
        <ol>
          <li>Use the map to look around the sky.</li>
          <li>Find the stars listed in the panel.</li>
          <li>Tap or click each star and get a final time.</li>
          <li>Find the stars in any order. Expand the game panel whenever you need the list.</li>
        </ol>
        <button className={styles.closeButton} onClick={onClose}>
          Close
        </button>
      </section>
    </Dialog>
  );
};

export default HowToPlay;
