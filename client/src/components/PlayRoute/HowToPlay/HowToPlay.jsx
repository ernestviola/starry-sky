import shared from '../shared.module.css';
import styles from './howToPlay.module.css';

const HowToPlay = ({ ref, onClose }) => {
  return (
    <dialog
      ref={ref}
      className={shared.dialog}
      onCancel={(e) => e.preventDefault()}
    >
      <section className={styles.content}>
        <h1>How to play</h1>
        <img src='/play-preview.png' alt='Preview of the Starry Sky game' />
        <ol>
          <li>Use the map to look around the sky.</li>
          <li>Find the stars listed in the panel.</li>
          <li>Click each star and get a final time.</li>
        </ol>
        <button className={styles.closeButton} onClick={onClose}>
          Close
        </button>
      </section>
    </dialog>
  );
};

export default HowToPlay;
