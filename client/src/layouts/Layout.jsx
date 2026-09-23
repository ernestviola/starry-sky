import { Outlet, useLocation } from 'react-router';
import Navbar from '../components/Navbar/Navbar.jsx';
import StarMap from '../components/StarMap/index.jsx';
import { useStarMap } from '../contexts/StarMapContext.jsx';
import styles from './layout.module.css';

const Layout = () => {
  const { hoveredStarId, setHoveredStarId, handleClick } = useStarMap();
  const { pathname } = useLocation();
  const normalizedPathname = pathname.replace(/\/+$/, '') || '/';
  const showStarMap = !['/about', '/design-system'].includes(normalizedPathname);

  return (
    <div className={styles.layout}>
      {showStarMap && (
        <div className={styles.mapLayer}>
          <StarMap
            hoveredStarId={hoveredStarId}
            setHoveredStarId={setHoveredStarId}
            handleClick={handleClick}
            enableHover={pathname !== '/'}
          />
        </div>
      )}
      <Navbar />
      <main
        className={`${styles.overlay} ${!showStarMap ? styles.interactive : ''}`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
