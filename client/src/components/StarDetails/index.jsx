import { useEffect, useRef, useState } from 'react';
import styles from './starDetails.module.css';

import { useStarData } from '../../contexts/StarDataContext.jsx';

const StarDetails = ({
  hoveredStarId,
  selectedStarId,
  onClose,
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
    if (hoveredStarId && isPointerOverMap) {
      setDisplayedStarId(hoveredStarId);
      setIsExiting(false);
      return;
    }

    if (!displayedStarId) return;
    setIsExiting(true);
    const timeout = setTimeout(() => setDisplayedStarId(null), 180);
    return () => clearTimeout(timeout);
  }, [hoveredStarId, isPointerOverMap, displayedStarId]);

  const selectedStarData = selectedStarId != null ? starsDictionary[selectedStarId] : null;
  const starId = selectedStarData ? selectedStarId : displayedStarId;
  const starData = starId != null ? starsDictionary[starId] : null;
  if (!starData) return null;
  const identifier = starData.hip ? ['HIP', starData.hip] : ['ID', starData.id];
  const persistent = Boolean(selectedStarData);

  return (
    <div
      ref={cardRef}
      className={`${styles.container} ${persistent ? styles.selected :
        isExiting ? styles.fadeOut : styles.fadeIn}`}
      style={persistent ? undefined : { left: mousePosition.x, top: mousePosition.y }}
      role={persistent ? 'region' : undefined}
      aria-label={persistent ? 'Selected star details' : undefined}
    >
      {persistent && <button className={styles.close} type='button' onClick={onClose}
        aria-label='Close star details'>×</button>}
      <p className={styles.data}><span>{identifier[0]}</span>{identifier[1]}</p>
      {starData.proper && (
        <p className={styles.data}><span>NAME</span>{starData.proper}</p>
      )}
      <p className={styles.data}><span>MAG</span>{starData.mag ?? '—'}</p>
    </div>
  );
};

export default StarDetails;
