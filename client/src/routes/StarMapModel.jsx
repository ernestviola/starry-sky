import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid, OrbitControls, Line, Html } from '@react-three/drei';
import * as THREE from 'three';

/**
 * ability to scale the star inward towards the earth
 * limit the height of the right ascension to where the star and the sphere meet
 * highlight the edge of the sphere where the right ascension and the sphere form a cross section
 * label the radius of the circle that is formed by the right ascension as the height of the right ascension moves up and down
 */

// right acension
/**
 * a^2 + b^2 = c^2
 * r = sqrt(8)
 *
 *
 */
const RightAscension = ({ RAHeight, starPos }) => {
  /**
   * add angle label
   * highlight the portion of the right acension that overlaps with
   */
  const x = starPos[0];
  const y = starPos[2];

  return (
    <>
      <mesh position={[0, RAHeight, 0]}>
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
        />
      </mesh>
    </>
  );
};

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
          Star [{starPos[0]},{starPos[1]},{starPos[2]}]
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
  reCalcParameters,
  RAHeight,
  setRAHeight,
  starRadius,
  setStarRadius,
}) => {
  const [xInput, setXInput] = useState(String(starPos[0]));
  const [yInput, setYInput] = useState(String(starPos[1]));
  const [zInput, setZInput] = useState(String(starPos[2]));

  useEffect(() => {
    setXInput(starPos[0]);
    setYInput(starPos[1]);
    setZInput(starPos[2]);
  }, [starPos]);
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
      }}
    >
      {/* RA Height Control */}
      <label htmlFor=''>
        RA Height: {RAHeight}
        <input
          type='range'
          min={-Math.min(Math.abs(starPos[1]), 1)}
          max={Math.min(1, Math.abs(starPos[1]))}
          step={0.01}
          value={RAHeight}
          onChange={(e) => setRAHeight(parseFloat(e.target.value))}
        />
      </label>

      {/* Star Distance Control */}
      <label htmlFor=''>
        Star Distance: {starRadius.toFixed(2)}
        <input
          type='range'
          min={1}
          max={5}
          step={0.01}
          value={starRadius}
          onChange={(e) => setStarRadius(parseFloat(e.target.value))}
        />
      </label>

      {/* Star X,Y,Z */}
      <label htmlFor=''>
        X:{' '}
        <input
          type='number'
          step={0.01}
          value={xInput}
          onChange={(e) => {
            setXInput(e.target.value);
            const parsed = parseFloat(e.target.value);
            reCalcParameters(parsed, starPos[1], starPos[2]);
          }}
        />
      </label>
      <label htmlFor=''>
        Y:{' '}
        <input
          type='number'
          step={0.01}
          value={yInput}
          onChange={(e) => {
            setYInput(e.target.value);
            const parsed = parseFloat(e.target.value);
            reCalcParameters(starPos[0], parsed, starPos[2]);
          }}
        />
      </label>
      <label htmlFor=''>
        Z:{' '}
        <input
          type='number'
          step={0.01}
          value={zInput}
          onChange={(e) => {
            setZInput(e.target.value);
            const parsed = parseFloat(e.target.value);
            reCalcParameters(starPos[0], starPos[1], parsed);
          }}
        />
      </label>
      <div>r1 = starRadius, r2 = cos()</div>
    </div>
  );
};

const PointLabels = ({ starPos, RAHeight }) => {
  // origin
  // RA Z
  // RA XZ

  return (
    <>
      {/* origin */}
      <Html position={[0, 0, 0]}>
        <div style={{ color: 'white' }}>A</div>
      </Html>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.02, 32, 32]} />
        <meshStandardMaterial color='black' />
      </mesh>
      {/* RA Z */}
      <Html position={[0, 0, starPos[2]]}>
        <div style={{ color: 'white' }}>B</div>
      </Html>
      <mesh position={[0, 0, starPos[2]]}>
        <sphereGeometry args={[0.02, 32, 32]} />
        <meshStandardMaterial color='black' />
      </mesh>
      {/* RA XZ */}
      <Html position={[starPos[0], 0, starPos[2]]}>
        <div style={{ color: 'white' }}>C</div>
      </Html>
      <mesh position={[starPos[0], 0, starPos[2]]}>
        <sphereGeometry args={[0.02, 32, 32]} />
        <meshStandardMaterial color='black' />
      </mesh>
    </>
  );
};

const StarMapModel = () => {
  const [gridSize, setGridSize] = useState(10);
  const [starRadius, setStarRadius] = useState(3);
  const [declinationAngle, setDeclinationAngle] = useState(Math.PI / 6);
  const [rightAscensionAngle, setRightAscensionAngle] = useState(Math.PI / 4);

  const [RAHeight, setRAHeight] = useState(0);

  const starPos = [
    (
      starRadius *
      Math.cos(declinationAngle) *
      Math.sin(rightAscensionAngle)
    ).toFixed(2),
    (starRadius * Math.sin(declinationAngle)).toFixed(2),
    (
      starRadius *
      Math.cos(declinationAngle) *
      Math.cos(rightAscensionAngle)
    ).toFixed(2),
  ];

  useEffect(() => {
    const currentHeight = RAHeight;
    console.log(currentHeight);

    setRAHeight(Math.min(currentHeight, starPos[1]));
  }, [starRadius]);

  const reCalcParameters = (x, y, z) => {
    /*
     * x^2 + y^2 = distance_to_star_xz_plane^2
     * distance_to_star_xz_plane^2 + z^2 = distance_to_star = newStarRadius
     */
    const newStarRadius = Math.sqrt(x * x + y * y + z * z);

    /*
     * sin(dec) = y/r
     * given y and r, asin(y/r) = dec
     */
    const newDeclinationAngle = Math.asin(y / newStarRadius);
    const newRightAscensionAngle = Math.atan2(x, z);

    /*
     *
     */
    setDeclinationAngle(newDeclinationAngle);
    setRightAscensionAngle(newRightAscensionAngle);
    setStarRadius(newStarRadius);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas camera={{ position: [1, 3, 10] }}>
        <ModelGrid gridSize={gridSize} />
        <PointLabels starPos={starPos} RAHeight={RAHeight} />
        <Declination starPos={starPos} />
        <RightAscension starPos={starPos} RAHeight={RAHeight} />
        <Star starPos={starPos} />
        <Earth />
        <OrbitControls />
      </Canvas>
      <Controls
        starPos={starPos}
        RAHeight={RAHeight}
        setRAHeight={setRAHeight}
        starRadius={starRadius}
        setStarRadius={setStarRadius}
        reCalcParameters={reCalcParameters}
      />
    </div>
  );
};

export default StarMapModel;
