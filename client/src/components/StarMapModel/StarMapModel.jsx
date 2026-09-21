import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid, OrbitControls, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import styles from './starMapModel.module.css';

const RightAscension = ({ starPos }) => (
  <mesh>
    <bufferGeometry key={starPos.join(',')}>
      <bufferAttribute
        attach='attributes-position'
        count={3}
        array={
          new Float32Array([
            0,
            0,
            0,
            starPos[0],
            0,
            starPos[2],
            0,
            0,
            starPos[2],
          ])
        }
        itemSize={3}
      />
    </bufferGeometry>
    <meshStandardMaterial
      color='blue'
      side={THREE.DoubleSide}
      transparent
      opacity={0.4}
      depthWrite={false}
    />
  </mesh>
);

const Declination = ({ starPos }) => {
  return (
    <>
      <Line
        points={[
          [0, 0, 0],
          [starPos[0], starPos[1], starPos[2]],
        ]}
        color='purple'
      />
      <Line
        points={[
          [0, 0, 0],
          [starPos[0], 0, starPos[2]],
        ]}
        color='purple'
      />
      <Line
        points={[
          [starPos[0], 0, starPos[2]],
          [starPos[0], starPos[1], starPos[2]],
        ]}
        color='purple'
      />

      <mesh>
        <bufferGeometry key={starPos.join(',')}>
          <bufferAttribute
            attach='attributes-position'
            count={3}
            array={
              new Float32Array([
                0,
                0,
                0,
                starPos[0],
                starPos[1],
                starPos[2],
                starPos[0],
                0,
                starPos[2],
              ])
            }
            itemSize={3}
          />
        </bufferGeometry>
        <meshStandardMaterial
          color='purple'
          side={THREE.DoubleSide}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>
    </>
  );
};

const AngleArcs = ({ starRadius, declinationAngle, rightAscensionAngle }) => {
  const horizontalRadius = starRadius * Math.cos(declinationAngle);
  const steps = 32;
  const pointAt = (angle, radius) => [
    radius * Math.sin(rightAscensionAngle),
    starRadius * Math.sin(angle),
    radius * Math.cos(rightAscensionAngle),
  ];
  const raPoints = Array.from({ length: steps + 1 }, (_, index) => {
    const angle = (rightAscensionAngle * index) / steps;
    return [horizontalRadius * Math.sin(angle), 0, horizontalRadius * Math.cos(angle)];
  });
  const decPoints = Array.from({ length: steps + 1 }, (_, index) => {
    const angle = (declinationAngle * index) / steps;
    return pointAt(angle, starRadius * Math.cos(angle));
  });
  const raLabel = raPoints[Math.floor(steps / 2)];
  const decLabel = decPoints[Math.floor(steps / 2)];

  return (
    <>
      <Line points={raPoints} color='deepskyblue' lineWidth={2} />
      <Html position={raLabel}>
        <div style={{ color: 'deepskyblue' }}>RA</div>
      </Html>
      <Line points={decPoints} color='orchid' lineWidth={2} />
      <Html position={decLabel}>
        <div style={{ color: 'orchid' }}>Dec</div>
      </Html>
    </>
  );
};

const ModelGrid = ({ gridSize }) => {
  const lineSize = gridSize / 2;
  return (
    <>
      <color attach='background' args={['#323232']} />
      <Grid
        args={[gridSize, gridSize, gridSize]}
        side={THREE.DoubleSide}
        cellSize={0.5}
      />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, -5]} intensity={1} />
      {/* x axis */}
      <Html position={[lineSize + 0.1, 0, 0]}>
        <div style={{ color: 'white' }}>+X</div>
      </Html>
      <Html position={[-(lineSize + 0.1), 0, 0]}>
        <div style={{ color: 'white' }}>-X</div>
      </Html>
      <Line
        points={[
          [-lineSize, 0, 0],
          [lineSize, 0, 0],
        ]}
        color='red'
      />
      {/* y axis */}
      <Html position={[0, -(lineSize + 0.1), 0]}>
        <div style={{ color: 'white' }}>-Y</div>
      </Html>
      <Html position={[0, lineSize + 0.5, 0]}>
        <div style={{ color: 'white' }}>+Y</div>
      </Html>
      <Line
        points={[
          [0, -lineSize, 0],
          [0, lineSize, 0],
        ]}
        color='green'
      />

      {/* z axis */}
      <Html position={[0, 0, -(lineSize + 0.1)]}>
        <div style={{ color: 'white' }}>-Z</div>
      </Html>
      <Html position={[0, 0, lineSize + 0.1]}>
        <div style={{ color: 'white' }}>+Z</div>
      </Html>
      <Line
        points={[
          [0, 0, -lineSize],
          [0, 0, lineSize],
        ]}
        color='blue'
      />
    </>
  );
};

const Star = ({ starPos }) => {
  return (
    <>
      <mesh position={[starPos[0], starPos[1], starPos[2]]}>
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshStandardMaterial
          color='yellow'
          side={THREE.DoubleSide}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>
      <Html position={[starPos[0], starPos[1], starPos[2]]}>
        <div style={{ color: 'white' }}>
          Star [{starPos.map((coordinate) => coordinate.toFixed(2)).join(', ')}]
        </div>
      </Html>
    </>
  );
};

const Earth = () => {
  const radius = 1;

  return (
    <>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry
          args={[radius, 32, 32, Math.PI, Math.PI * 1.5, 0, Math.PI / 2]}
        />
        <meshStandardMaterial color='white' side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry
          args={[
            radius,
            32,
            32,
            Math.PI,
            2 * Math.PI,
            Math.PI / 2,
            Math.PI / 2,
          ]}
        />
        <meshStandardMaterial color='white' side={THREE.DoubleSide} />
      </mesh>
      {/* Caps */}
      {/* back wall */}
      <mesh position={[0, 0, 0]}>
        <circleGeometry args={[1, 32, 0, Math.PI / 2]} />
        <meshStandardMaterial color='white' side={THREE.DoubleSide} />
      </mesh>
      {/* left wall */}
      <mesh position={[0, 0, 0]} rotation={[0, Math.PI * 1.5, 0]}>
        <circleGeometry args={[1, 32, 0, Math.PI / 2]} />
        <meshStandardMaterial color='white' side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, 0, 0]}>
        <sphereGeometry
          args={[1, 32, 32, Math.PI * 0.5, Math.PI * 0.5, 0, 0.5 * Math.PI]}
        />
        <meshStandardMaterial
          color='white'
          side={THREE.DoubleSide}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>
    </>
  );
};

const Controls = ({
  starPos,
  starRadius,
  setStarRadius,
  declinationAngle,
  setDeclinationAngle,
  rightAscensionAngle,
  setRightAscensionAngle,
}) => {
  const degrees = (angle) => THREE.MathUtils.radToDeg(angle).toFixed(1);

  return (
    <div className={styles.controllerParent}>
      <div className={styles.controlsContainer}>
        <label>
          Right ascension: {degrees(rightAscensionAngle)}°
          <input
            type='range'
            min={0}
            max={Math.PI * 2}
            step={0.01}
            value={rightAscensionAngle}
            onChange={(e) => setRightAscensionAngle(Number(e.target.value))}
          />
        </label>
        <label>
          Declination: {degrees(declinationAngle)}°
          <input
            type='range'
            min={-Math.PI / 2}
            max={Math.PI / 2}
            step={0.01}
            value={declinationAngle}
            onChange={(e) => setDeclinationAngle(Number(e.target.value))}
          />
        </label>
        <label>
          Star distance: {starRadius.toFixed(2)}
          <input
            type='range'
            min={1}
            max={5}
            step={0.01}
            value={starRadius}
            onChange={(e) => setStarRadius(Number(e.target.value))}
          />
        </label>
        <div>
          x = {starRadius.toFixed(2)} cos({degrees(declinationAngle)}°) sin(
          {degrees(rightAscensionAngle)}°) = {starPos[0].toFixed(2)}
        </div>
        <div>
          y = {starRadius.toFixed(2)} sin({degrees(declinationAngle)}°) ={' '}
          {starPos[1].toFixed(2)}
        </div>
        <div>
          z = {starRadius.toFixed(2)} cos({degrees(declinationAngle)}°) cos(
          {degrees(rightAscensionAngle)}°) = {starPos[2].toFixed(2)}
        </div>
      </div>
    </div>
  );
};

const PointLabels = ({ starPos }) => (
  <>
    <Html position={[0, 0, 0]}>
      <div style={{ color: 'white' }}>Origin</div>
    </Html>
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[0.02, 32, 32]} />
      <meshStandardMaterial color='black' />
    </mesh>
    <Html position={[0, 0, starPos[2]]}>
      <div style={{ color: 'white' }}>Z</div>
    </Html>
    <mesh position={[0, 0, starPos[2]]}>
      <sphereGeometry args={[0.02, 32, 32]} />
      <meshStandardMaterial color='black' />
    </mesh>
    <Html position={[starPos[0], 0, starPos[2]]}>
      <div style={{ color: 'white' }}>XZ projection</div>
    </Html>
    <mesh position={[starPos[0], 0, starPos[2]]}>
      <sphereGeometry args={[0.02, 32, 32]} />
      <meshStandardMaterial color='black' />
    </mesh>
  </>
);

const StarMapModel = () => {
  const gridSize = 10;
  const [starRadius, setStarRadius] = useState(3);
  const [declinationAngle, setDeclinationAngle] = useState(Math.PI / 6);
  const [rightAscensionAngle, setRightAscensionAngle] = useState(Math.PI / 4);

  const starPos = [
    starRadius * Math.cos(declinationAngle) * Math.sin(rightAscensionAngle),
    starRadius * Math.sin(declinationAngle),
    starRadius * Math.cos(declinationAngle) * Math.cos(rightAscensionAngle),
  ];

  return (
    <div className={styles.container}>
      <Canvas camera={{ position: [1, 3, 10] }} className={styles.canvas}>
        <ModelGrid gridSize={gridSize} />
        <PointLabels starPos={starPos} />
        <Declination starPos={starPos} />
        <RightAscension starPos={starPos} />
        <AngleArcs
          starRadius={starRadius}
          declinationAngle={declinationAngle}
          rightAscensionAngle={rightAscensionAngle}
        />
        <Star starPos={starPos} />
        <Earth />
        <OrbitControls />
      </Canvas>
      <Controls
        starPos={starPos}
        starRadius={starRadius}
        setStarRadius={setStarRadius}
        declinationAngle={declinationAngle}
        setDeclinationAngle={setDeclinationAngle}
        rightAscensionAngle={rightAscensionAngle}
        setRightAscensionAngle={setRightAscensionAngle}
      />
    </div>
  );
};

export default StarMapModel;
