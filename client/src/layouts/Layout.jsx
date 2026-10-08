import { Outlet, useLocation } from 'react-router';
import Navbar from '../components/Navbar/Navbar.jsx';
import StarMap from '../components/StarMap/index.jsx';
import { useStarMap } from '../contexts/StarMapContext.jsx';
import styles from './layout.module.css';

const Layout = () => {
  const {
    hoveredStarId,
    setHoveredStarId,
    setSelectedStarId,
    starClickFeedback,
    handleClick,
    handleInteraction,
    searchTarget,
  } = useStarMap();
  const { pathname } = useLocation();
  const normalizedPathname = pathname.replace(/\/+$/, '') || '/';
  const showStarMap = !['/about', '/design-system'].includes(normalizedPathname);

  return (
    <div
      className={`${styles.layout} ${normalizedPathname === '/about' ? styles.aboutLayout : ''}`}
    >
      {showStarMap && (
        <div className={styles.mapLayer}>
          <StarMap
            hoveredStarId={hoveredStarId}
            setHoveredStarId={setHoveredStarId}
            setSelectedStarId={setSelectedStarId}
            starClickFeedback={starClickFeedback}
            searchTarget={searchTarget}
            handleClick={handleClick}
            handleInteraction={handleInteraction}
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
