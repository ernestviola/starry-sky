import { useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Grid, OrbitControls, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import styles from './starMapModel.module.css';

const RightAscension = ({ starPos, showZ, highlight }) => (
  <>
    <Line
      points={[
        [0, 0, 0],
        [starPos[0], 0, starPos[2]],
      ]}
      color={highlight === 'h' || highlight === 'all' ? 'gold' : 'deepskyblue'}
    />
    <Line
      points={[
        [0, 0, 0],
        [0, 0, starPos[2]],
      ]}
      color={highlight === 'z' || highlight === 'all' ? 'gold' : 'deepskyblue'}
    />
    <Line
      points={[
        [0, 0, starPos[2]],
        [starPos[0], 0, starPos[2]],
      ]}
      color={highlight === 'x' || highlight === 'all' ? 'gold' : 'deepskyblue'}
    />
    <Html position={[starPos[0] / 2, 0, starPos[2] / 2]}>
      <div className={`${styles.sceneLabel} ${highlight === 'h' || highlight === 'all' ? styles.highlightLabel : ''}`}>h</div>
    </Html>
    <Html position={[starPos[0] / 2, 0, starPos[2]]}>
      <div className={`${styles.sceneLabel} ${highlight === 'x' || highlight === 'all' ? styles.highlightLabel : ''}`}>x</div>
    </Html>
    {showZ && (
      <Html position={[0, 0, starPos[2] / 2]}>
        <div className={`${styles.sceneLabel} ${highlight === 'z' || highlight === 'all' ? styles.highlightLabel : ''}`}>z</div>
      </Html>
    )}
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
  </>
);

const Declination = ({ starPos, showHorizontalRadius, highlight }) => {
  return (
    <>
      <Html position={[starPos[0] / 2, starPos[1] / 2, starPos[2] / 2]}>
        <div className={styles.sceneLabel}>r = 1</div>
      </Html>
      <Html position={[starPos[0], starPos[1] / 2, starPos[2]]}>
        <div className={`${styles.sceneLabel} ${highlight === 'y' || highlight === 'all' ? styles.highlightLabel : ''}`}>y</div>
      </Html>
      {showHorizontalRadius && (
        <Html position={[starPos[0] / 2, 0, starPos[2] / 2]}>
          <div className={`${styles.sceneLabel} ${highlight === 'h' || highlight === 'all' ? styles.highlightLabel : ''}`}>h</div>
        </Html>
      )}
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
        color={highlight === 'h' || highlight === 'all' ? 'gold' : 'purple'}
      />
      <Line
        points={[
          [starPos[0], 0, starPos[2]],
          [starPos[0], starPos[1], starPos[2]],
        ]}
        color={highlight === 'y' || highlight === 'all' ? 'gold' : 'purple'}
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

const AngleArcs = ({
  starRadius,
  declinationAngle,
  rightAscensionAngle,
  showRightAscension,
  showDeclination,
  highlight,
}) => {
  const horizontalRadius = starRadius * Math.cos(declinationAngle);
  const steps = 32;
  const pointAt = (angle, radius) => [
    radius * Math.sin(rightAscensionAngle),
    starRadius * Math.sin(angle),
    radius * Math.cos(rightAscensionAngle),
  ];
  const raPoints = Array.from({ length: steps + 1 }, (_, index) => {
    const angle = (rightAscensionAngle * index) / steps;
    return [
      horizontalRadius * Math.sin(angle),
      0,
      horizontalRadius * Math.cos(angle),
    ];
  });
  const decPoints = Array.from({ length: steps + 1 }, (_, index) => {
    const angle = (declinationAngle * index) / steps;
    return pointAt(angle, starRadius * Math.cos(angle));
  });
  const raLabel = raPoints[Math.floor(steps / 2)];
  const decLabel = decPoints[Math.floor(steps / 2)];

  return (
    <>
      {showRightAscension && (
        <>
          <Line points={raPoints} color={highlight === 'ra' || highlight === 'all' ? 'gold' : 'deepskyblue'} lineWidth={2} />
          <Html position={raLabel}>
            <div className={`${styles.sceneLabel} ${styles.arcLabel} ${highlight === 'ra' || highlight === 'all' ? styles.highlightLabel : ''}`}>RA</div>
          </Html>
        </>
      )}
      {showDeclination && (
        <>
          <Line points={decPoints} color={highlight === 'dec' || highlight === 'all' ? 'gold' : 'orchid'} lineWidth={2} />
          <Html position={decLabel}>
            <div className={`${styles.sceneLabel} ${styles.arcLabel} ${highlight === 'dec' || highlight === 'all' ? styles.highlightLabel : ''}`}>Dec</div>
          </Html>
        </>
      )}
    </>
  );
};

const CameraRig = ({ step, rightAscensionAngle }) => {
  const { camera } = useThree();
  const transition = useRef({
    key: '',
    start: new THREE.Spherical(),
    target: new THREE.Spherical(),
    elapsed: 0,
  });
  const views = {
    0: [1, 0.51, 1.8],
    1: [
      -Math.cos(rightAscensionAngle) * 3,
      0.6,
      Math.sin(rightAscensionAngle) * 3,
    ],
    2: [
      -Math.cos(rightAscensionAngle) * 3,
      0.6,
      Math.sin(rightAscensionAngle) * 3,
    ],
    3: [0, 3, 0.01],
    4: [0, 3, 0.01],
    5: [1, 1.5, 3],
  };
  const position = new THREE.Vector3(...views[step]);
  const duration =
    { 0: 1.2, 1: 0.8, 2: 0.8, 3: 1.2, 4: 0.8, 5: 1 }[step] ?? 1.2;
  const viewKey = String(step);

  if (transition.current.key !== viewKey) {
    transition.current = {
      key: viewKey,
      start: new THREE.Spherical().setFromVector3(camera.position),
      target: new THREE.Spherical().setFromVector3(position),
      elapsed: 0,
    };
  }

  useFrame((_, delta) => {
    if (transition.current.elapsed >= duration) return;

    transition.current.elapsed = Math.min(
      transition.current.elapsed + delta,
      duration,
    );
    const progress = THREE.MathUtils.smoothstep(
      transition.current.elapsed / duration,
      0,
      1,
    );
    const { start, target } = transition.current;
    camera.position.setFromSpherical(
      new THREE.Spherical(
        THREE.MathUtils.lerp(start.radius, target.radius, progress),
        THREE.MathUtils.lerp(start.phi, target.phi, progress),
        THREE.MathUtils.lerp(start.theta, target.theta, progress),
      ),
    );
    camera.lookAt(0, 0, 0);
  });

  return null;
};

const ModelGrid = ({ gridSize }) => {
  const lineSize = gridSize / 2;
  return (
    <>
      <color attach='background' args={['#0b0c16']} />
      <Grid
        args={[gridSize, gridSize, gridSize]}
        side={THREE.DoubleSide}
        cellSize={0.5}
      />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, -5]} intensity={1} />
      {/* x axis */}
      <Html position={[lineSize + 0.1, 0, 0]}>
        <div className={styles.axisLabel}>+X</div>
      </Html>
      <Html position={[-(lineSize + 0.1), 0, 0]}>
        <div className={styles.axisLabel}>-X</div>
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
        <div className={styles.axisLabel}>-Y</div>
      </Html>
      <Html position={[0, lineSize + 0.5, 0]}>
        <div className={styles.axisLabel}>+Y</div>
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
        <div className={styles.axisLabel}>-Z</div>
      </Html>
      <Html position={[0, 0, lineSize + 0.1]}>
        <div className={styles.axisLabel}>+Z</div>
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
        <div className={styles.sceneLabel}>
          Star [{starPos.map((coordinate) => coordinate.toFixed(2)).join(', ')}]
        </div>
      </Html>
    </>
  );
};

const CelestialSphere = () => (
  <mesh>
    <sphereGeometry args={[1, 32, 16]} />
    <meshBasicMaterial
      color='white'
      wireframe
      transparent
      opacity={0.25}
      depthWrite={false}
    />
  </mesh>
);

const Controls = ({
  starPos,
  starRadius,
  declinationAngle,
  setDeclinationAngle,
  rightAscensionAngle,
  setRightAscensionAngle,
  step,
  setStep,
  showNavigation,
  showSphere,
  setShowSphere,
}) => {
  const degrees = (angle) => THREE.MathUtils.radToDeg(angle).toFixed(1);
  const horizontalRadius = starRadius * Math.cos(declinationAngle);
  const stage = [
    'Explore',
    'Find y',
    'Find the horizontal radius, h',
    'Find x',
    'Find z',
    'Combine the coordinates',
  ][step];

  return (
    <div className={styles.controllerParent}>
      <div className={styles.controlsContainer}>
        <div className={styles.stepTitle}>{stage}</div>
        <label className={styles.toggle}>
          <input
            type='checkbox'
            checked={showSphere}
            onChange={(event) => setShowSphere(event.target.checked)}
          />
          Show sphere wireframe
        </label>
        {(step === 0 || step >= 3) && (
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
        )}
        {(step <= 2 || step === 5) && (
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
        )}
        {step === 1 && (
          <>
            <div className={styles.equation}>Given: r = 1</div>
            <div className={styles.equation}>sin(Dec) = y / r</div>
            <div className={styles.equation}>sin(Dec) = y / 1</div>
            <div className={styles.equation}>
              y = sin(Dec) = {starPos[1].toFixed(2)}
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div className={styles.equation}>cos(Dec) = h / r</div>
            <div className={styles.equation}>cos(Dec) = h / 1</div>
            <div className={styles.equation}>
              h = cos(Dec) = {horizontalRadius.toFixed(2)}
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <div className={styles.equation}>
              Given: h = {horizontalRadius.toFixed(2)}
            </div>
            <div className={styles.equation}>sin(RA) = x / h</div>
            <div className={styles.equation}>
              x = h sin(RA) = {starPos[0].toFixed(2)}
            </div>
          </>
        )}
        {step === 4 && (
          <>
            <div className={styles.equation}>
              Given: h = {horizontalRadius.toFixed(2)}
            </div>
            <div className={styles.equation}>cos(RA) = z / h</div>
            <div className={styles.equation}>
              z = h cos(RA) = {starPos[2].toFixed(2)}
            </div>
          </>
        )}
        {step === 5 && (
          <>
            <div className={styles.equation}>
              x = cos(Dec) sin(RA) = {starPos[0].toFixed(2)}
            </div>
            <div className={styles.equation}>
              y = sin(Dec) = {starPos[1].toFixed(2)}
            </div>
            <div className={styles.equation}>
              z = cos(Dec) cos(RA) = {starPos[2].toFixed(2)}
            </div>
          </>
        )}
        {showNavigation && (
          <div className={styles.stepNavigation}>
            <button disabled={step === 1} onClick={() => setStep(step - 1)}>
              Previous
            </button>
            <button disabled={step === 5} onClick={() => setStep(step + 1)}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const PointLabels = ({ starPos, showZ }) => (
  <>
    <Html position={[0, 0, 0]}>
      <div className={styles.sceneLabel}>Origin</div>
    </Html>
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[0.02, 32, 32]} />
      <meshStandardMaterial color='black' />
    </mesh>
    {showZ && (
      <>
        <Html position={[0, 0, starPos[2]]}>
          <div className={styles.sceneLabel}>Z</div>
        </Html>
        <mesh position={[0, 0, starPos[2]]}>
          <sphereGeometry args={[0.02, 32, 32]} />
          <meshStandardMaterial color='black' />
        </mesh>
      </>
    )}
    <Html position={[starPos[0], 0, starPos[2]]}>
      <div className={styles.sceneLabel}>XZ projection</div>
    </Html>
    <mesh position={[starPos[0], 0, starPos[2]]}>
      <sphereGeometry args={[0.02, 32, 32]} />
      <meshStandardMaterial color='black' />
    </mesh>
  </>
);

const StarMapModel = ({
  step: controlledStep,
  onStepChange,
  showNavigation = true,
  stacked = false,
  showControls = true,
  presentation = false,
}) => {
  const gridSize = 4;
  const starRadius = 1;
  const [declinationAngle, setDeclinationAngle] = useState(Math.PI / 6);
  const [rightAscensionAngle, setRightAscensionAngle] = useState(Math.PI / 4);
  const [showSphere, setShowSphere] = useState(true);
  const [selectedStep, setSelectedStep] = useState(1);
  const step = controlledStep ?? selectedStep;
  const setStep = (nextStep) => {
    if (controlledStep === undefined) setSelectedStep(nextStep);
    onStepChange?.(nextStep);
  };

  const starPos = [
    starRadius * Math.cos(declinationAngle) * Math.sin(rightAscensionAngle),
    starRadius * Math.sin(declinationAngle),
    starRadius * Math.cos(declinationAngle) * Math.cos(rightAscensionAngle),
  ];
  const highlights = {
    1: { declination: 'y', arc: 'dec' },
    2: { declination: 'h', arc: 'dec' },
    3: { rightAscension: 'x', arc: 'ra' },
    4: { rightAscension: 'z', arc: 'ra' },
    5: { declination: 'all', rightAscension: 'all', arc: 'all' },
  };
  const highlight = highlights[step] ?? {};

  return (
    <div
      className={`${styles.container} ${stacked ? styles.stacked : ''} ${
        presentation ? styles.presentation : ''
      }`}
    >
      <Canvas
        camera={{ position: [-1.8, 0.51, 1.8] }}
        className={styles.canvas}
      >
        <CameraRig step={step} rightAscensionAngle={rightAscensionAngle} />
        <ModelGrid gridSize={gridSize} />
        <PointLabels starPos={starPos} showZ={step === 0 || step >= 3} />
        {(step === 0 || step <= 2 || step === 5) && (
          <Declination
            starPos={starPos}
            showHorizontalRadius={step === 0 || step >= 2}
            highlight={highlight.declination}
          />
        )}
        {(step === 0 || step >= 3) && (
          <RightAscension
            starPos={starPos}
            showZ={step === 0 || step >= 4}
            highlight={highlight.rightAscension}
          />
        )}
        <AngleArcs
          starRadius={starRadius}
          declinationAngle={declinationAngle}
          rightAscensionAngle={rightAscensionAngle}
          showRightAscension={step === 0 || step >= 3}
          showDeclination={step === 0 || step <= 2 || step === 5}
          highlight={highlight.arc}
        />
        {(step === 0 || step <= 2 || step === 5) && <Star starPos={starPos} />}
        {showSphere && <CelestialSphere />}
        <OrbitControls enabled={step === 0 || step === 5} enableZoom={false} />
      </Canvas>
      {showControls && (
        <Controls
          starPos={starPos}
          starRadius={starRadius}
          declinationAngle={declinationAngle}
          setDeclinationAngle={setDeclinationAngle}
          rightAscensionAngle={rightAscensionAngle}
          setRightAscensionAngle={setRightAscensionAngle}
          step={step}
          setStep={setStep}
          showNavigation={showNavigation}
          showSphere={showSphere}
          setShowSphere={setShowSphere}
        />
      )}
    </div>
  );
};

export default StarMapModel;
