import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { getStarPosition } from './starPosition.js';

const ConstellationLines = ({ constellationLinesDictionary, highlightedConstellationName }) => {
  const constellations = useMemo(() => {
    const shaped = {};
    for (const point of Object.values(constellationLinesDictionary)) {
      const { constellationName, lineIndex, star } = point;
      if (!star || !Number.isFinite(star.decrad) || !Number.isFinite(star.rarad)) continue;
      if (!shaped[constellationName]) shaped[constellationName] = [];
      if (!shaped[constellationName][lineIndex]) shaped[constellationName][lineIndex] = [];
      const { x, y, z } = getStarPosition(star.decrad, star.rarad);
      shaped[constellationName][lineIndex].push([x, y, z]);
    }
    return shaped;
  }, [constellationLinesDictionary]);

  return (
    <>
      {Object.entries(constellations).flatMap(([name, lines]) =>
        lines.flatMap((points, index) => {
          if (!points || points.length < 2) return [];
          const highlighted = name === highlightedConstellationName;
          return [
            <Line
              key={`${name}-${index}`}
              points={points}
              color={highlighted ? '#c28dff' : '#aaaaaa'}
              transparent
              opacity={highlighted ? 1 : 0.5}
              lineWidth={highlighted ? 2 : 1}
            />,
          ];
        }),
      )}
    </>
  );
};

export default ConstellationLines;
