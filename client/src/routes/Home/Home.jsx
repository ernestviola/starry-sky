import styles from './home.module.css';
import { NavLink } from 'react-router';

const Home = () => {
  return (
    <div className={styles.home}>
      <title>Home | Starry Sky</title>
      <section className={styles.hero}>
        <h1>Know your sky?</h1>
        <div className={styles.heroActions}>
          <p>Compete against others and see who knows their sky the best!</p>
          <NavLink to='/play'>Play now</NavLink>
        </div>
      </section>
    </div>
  );
};

export default Home;
