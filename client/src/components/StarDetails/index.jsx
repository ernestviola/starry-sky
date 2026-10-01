import { useEffect, useRef, useState } from 'react';
import styles from './starDetails.module.css';

import { useStarData } from '../../contexts/StarDataContext.jsx';

const StarDetails = ({
  hoveredStarId,
  selectedStarId,
  setSelectedStarId,
}) => {
  const { starsDictionary } = useStarData();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [displayedStarId, setDisplayedStarId] = useState(null);
  const [isPointerOverMap, setIsPointerOverMap] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const handlePointerMove = (event) => {
      const isOverMap =
        event.target instanceof Element && event.target.closest('canvas');
      setIsPointerOverMap(Boolean(isOverMap));

      const offset = 16;
      const edgeBuffer = 200;
      const width = cardRef.current?.offsetWidth ?? 180;
      const height = cardRef.current?.offsetHeight ?? 80;
      const padding = 8;
      const shouldFlipX =
        event.clientX + offset + width + edgeBuffer > window.innerWidth;
      const shouldFlipY =
        event.clientY + offset + height + edgeBuffer > window.innerHeight;

      setMousePosition({
        x: Math.max(
          padding,
          shouldFlipX ? event.clientX - width - offset : event.clientX + offset,
        ),
        y: Math.max(
          padding,
          shouldFlipY ? event.clientY - height - offset : event.clientY + offset,
        ),
      });
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  useEffect(() => {
    if (selectedStarId) return;
    if (hoveredStarId && isPointerOverMap) {
      setDisplayedStarId(hoveredStarId);
      setIsExiting(false);
      return;
    }

    if (!displayedStarId) return;
    setIsExiting(true);
    const timeout = setTimeout(() => setDisplayedStarId(null), 180);
    return () => clearTimeout(timeout);
  }, [hoveredStarId, isPointerOverMap, displayedStarId, selectedStarId]);

  const starId = selectedStarId ?? displayedStarId;
  const starData = starId ? starsDictionary[starId] : null;
  if (!starData) return null;

  if (selectedStarId) {
    return (
      <aside className={styles.selectedContainer} aria-label='Selected star'>
        <button
          className={styles.dismiss}
          type='button'
          aria-label='Dismiss star details'
          onClick={() => setSelectedStarId(null)}
        >
          ×
        </button>
        <p className={styles.data}>HIP: {starData.hip}</p>
        {starData.proper && (
          <p className={styles.data}>NAME: {starData.proper}</p>
        )}
        <p className={styles.data}>MAG: {starData.mag}</p>
      </aside>
    );
  }

  return (
    <div
      ref={cardRef}
      className={`${styles.container} ${
        isExiting ? styles.fadeOut : styles.fadeIn
      }`}
      style={{ left: mousePosition.x, top: mousePosition.y }}
    >
      <p className={styles.data}>HIP: {starData.hip}</p>
      {starData.proper && (
        <p className={styles.data}>NAME: {starData.proper}</p>
      )}
      <p className={styles.data}>MAG: {starData.mag}</p>
    </div>
  );
};

export default StarDetails;
