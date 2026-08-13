import * as THREE from 'three';
import { useEffect, useState } from 'react';
import { Line } from '@react-three/drei';

const STEP_SIZE = 0.005;

const ConstellationLines = ({ constellationLines }) => {
  const [constellations, setConstellations] = useState({});

  const slerp = (a, b, t) => {
    // a,b are vectors
    // t is a scalar
    const omega = Math.acos(a[0] * b[0] + a[1] * b[1] + a[2] * b[2]);

    const x =
      (Math.sin((1 - t) * omega) / Math.sin(omega)) * a[0] +
      (Math.sin(t * omega) / Math.sin(omega)) * b[0];
    const y =
      (Math.sin((1 - t) * omega) / Math.sin(omega)) * a[1] +
      (Math.sin(t * omega) / Math.sin(omega)) * b[1];
    const z =
      (Math.sin((1 - t) * omega) / Math.sin(omega)) * a[2] +
      (Math.sin(t * omega) / Math.sin(omega)) * b[2];

    return [x, y, z];
  };

  const slerpExpand = (lineArray) => {
    if (lineArray.length < 2) return lineArray;

    const newArr = [];
    newArr.push(lineArray[0]);
    let a = lineArray[0];
    for (let i = 1; i < lineArray.length; i++) {
      let b = lineArray[i];

      for (let j = STEP_SIZE; j < 1; j += STEP_SIZE) {
        newArr.push(slerp(a, b, j));
      }
      newArr.push(b);

      a = lineArray[i];
    }
    return newArr;
  };
  useEffect(() => {
    const shapeConstellations = () => {
      const shaped = {};
      Object.values(constellationLines).map((data) => {
        if (!shaped[data.constellationName]) {
          const { constellation, ...rest } = data;
          shaped[data.constellationName] = {
            pointTotal: 0,
            data: rest,
            lines: [],
          };
        }

        const lines = shaped[data.constellationName].lines;

        if (lines.length != data.lineIndex + 1) {
          lines.push([]);
        }

        const x = Math.cos(data.star.decrad) * Math.sin(data.star.rarad);
        const y = Math.sin(data.star.decrad);
        const z = Math.cos(data.star.decrad) * Math.cos(data.star.rarad);
        lines[data.lineIndex].push([x, y, z]);
        shaped[data.constellationName].pointTotal++;
      });
      return shaped;
    };

    setConstellations(shapeConstellations());
  }, [constellationLines]);
  return (
    <>
      {Object.entries(constellations).map(([con, values]) => {
        const lines = values.lines;

        return lines.map((line, i) => {
          return (
            <Line
              points={line}
              color='#aaaaaa'
              key={`${con}${i}`}
              transparent={true}
              opacity={0.5}
            />
          );
        });
      })}
    </>
  );
};

export default ConstellationLines;
