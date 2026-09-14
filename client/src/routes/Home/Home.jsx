import { useState } from 'react';
import styles from './home.module.css';
import { NavLink } from 'react-router';

import StarMap from '../../components/StarMap/index.jsx';

const Home = () => {
  const [hoveredStarId, setHoveredStarId] = useState(null);
  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <h1>Know your sky?</h1>
        <div className={styles.heroActions}>
          <p>Compete against others and see who knows their sky the best!</p>
          <NavLink to='/play'>Play now</NavLink>
        </div>
      </section>
      <section className={styles.starMap}>
        <StarMap />
      </section>
    </div>
  );
};

export default Home;
