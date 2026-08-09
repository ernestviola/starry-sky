import * as THREE from 'three';
import { useEffect, useState } from 'react';
import { Line } from '@react-three/drei';

const ConstellationLines = ({ constellationLines }) => {
  const [constellations, setConstellations] = useState({});
  useEffect(() => {
    const shapeConstellations = () => {
      const shaped = {};
      Object.values(constellationLines).map((data) => {
        // add a constellation with an array of segments
        if (!shaped[data.constellation]) {
          const { constellation, ...rest } = data;
          shaped[data.constellation] = { data: rest, segments: [] };
        }

        const segments = shaped[data.constellation].segments;

        if (segments.length != data.segmentIndex + 1) {
          // need to add a new index
          // empty array
          segments.push([]);
        }

        const x = Math.cos(data.decrad) * Math.sin(data.rarad);
        const y = Math.sin(data.decrad);
        const z = Math.cos(data.decrad) * Math.cos(data.rarad);
        segments[data.segmentIndex].push([x, y, z]);
      });

      return shaped;
    };

    setConstellations(shapeConstellations());
    console.log(constellations);
  }, [constellationLines]);
  return (
    <>
      {Object.entries(constellations).map(([con, values]) => {
        const segments = values.segments;

        return segments.map((line, i) => {
          return <Line points={line} color='red' key={`${con}${i}`} />;
        });
      })}
    </>
  );
};

export default ConstellationLines;
