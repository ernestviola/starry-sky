import { Outlet, useLocation } from 'react-router';
import Navbar from '../components/Navbar/Navbar.jsx';
import StarMap from '../components/StarMap/index.jsx';
import { useStarMap } from '../contexts/StarMapContext.jsx';
import styles from './layout.module.css';

const Layout = () => {
  const { hoveredStarId, setHoveredStarId, handleClick } = useStarMap();
  const { pathname } = useLocation();
  const showStarMap = pathname !== '/about';

  return (
    <div className={styles.layout}>
      {showStarMap && (
        <div className={styles.mapLayer}>
          <StarMap
            hoveredStarId={hoveredStarId}
            setHoveredStarId={setHoveredStarId}
            handleClick={handleClick}
          />
        </div>
      )}
      <Navbar />
      <main className={styles.overlay}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
