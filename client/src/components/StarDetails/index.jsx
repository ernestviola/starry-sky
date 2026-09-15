import { useEffect, useRef, useState } from 'react';
import styles from './starDetails.module.css';

import { useStarData } from '../../contexts/StarDataContext.jsx';

const StarDetails = ({ hoveredStarId }) => {
  // position next to the mouse x,y either up down left or right depending on where there's space on the screen

  // if the screen is too small then we put the info on the top right
  const { starsDictionary } = useStarData();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  useEffect(() => {
    const handlePointerMove = (event) => {
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
  if (!hoveredStarId) return null;

  const starData = starsDictionary[hoveredStarId];
  if (!starData) return null;

  return (
    <div
      ref={cardRef}
      className={styles.container}
      style={{
        left: mousePosition.x + 16,
        top: mousePosition.y + 16,
      }}
    >
      <p>HIP: {starData.hip}</p>
      {starData.proper && <p>NAME: {starData.proper}</p>}
      <p>MAG: {starData.mag}</p>
    </div>
  );
};

export default StarDetails;
