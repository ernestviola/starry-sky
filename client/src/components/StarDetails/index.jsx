import { useEffect, useRef, useState } from 'react';
import styles from './starDetails.module.css';

import { useStarData } from '../../contexts/StarDataContext.jsx';

const StarDetails = ({ hoveredStarId }) => {
  // position next to the mouse x,y either up down left or right depending on where there's space on the screen

  // if the screen is too small then we put the info on the top right
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

      const x = shouldFlipX
        ? event.clientX - width - offset
        : event.clientX + offset;
      const y = shouldFlipY
        ? event.clientY - height - offset
        : event.clientY + offset;

      setMousePosition({
        x: Math.max(padding, x),
        y: Math.max(padding, y),
      });
    };

    window.addEventListener('pointermove', handlePointerMove);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
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

  if (!displayedStarId) return null;

  const starData = starsDictionary[displayedStarId];
  if (!starData) return null;

  return (
    <div
      ref={cardRef}
      className={`${styles.container} ${
        isExiting ? styles.fadeOut : styles.fadeIn
      }`}
      style={{
        left: mousePosition.x,
        top: mousePosition.y,
      }}
    >
      <p>HIP: {starData.hip}</p>
      {starData.proper && <p>NAME: {starData.proper}</p>}
      <p>MAG: {starData.mag}</p>
    </div>
  );
};

export default StarDetails;
