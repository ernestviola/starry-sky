import { createContext, useContext, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Grid, OrbitControls, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import styles from './starMapModel.module.css';

const MOBILE_QUERY = '(max-width: 700px)';
// The phone model stage is roughly square; this keeps the sphere as large as
// it can be while still fitting, so the labels have room around the triangle.
const MOBILE_CAMERA_DISTANCE = 1.05;

const subscribeToMobile = (onChange) => {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener?.('change', onChange);
  return () => query.removeEventListener?.('change', onChange);
};

const useIsMobile = () =>
  useSyncExternalStore(
    subscribeToMobile,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );

const SceneLabel = ({ children, mobile = false, className = '' }) => (
  <div className={`${styles.sceneLabel} ${styles.mobileSceneLabel} ${mobile ? styles.mobileSceneLabelActive : ''} ${className}`}>
    {children}
  </div>
);

// Phones use compact labels: unboxed text, centered on its point, then pushed
// a little away from the shape it describes so it never sits on the triangle.
const CompactLabelsContext = createContext(false);
const LABEL_OFFSET = 0.18;
const ORIGIN = [0, 0, 0];

const pushAway = (point, from, distance) => {
  const direction = new THREE.Vector3(...point).sub(new THREE.Vector3(...from));
  if (direction.lengthSq() < 1e-6) return point;
  return direction.normalize().multiplyScalar(distance).add(new THREE.Vector3(...point)).toArray();
};

const Tag = ({ position, compactPosition, away, mobile, className = '', compactText, children }) => {
  const compact = useContext(CompactLabelsContext);

  if (!compact) {
    return (
      <Html position={position}>
        <SceneLabel mobile={mobile} className={className}>{children}</SceneLabel>
      </Html>
    );
  }

  return (
    <Html center position={pushAway(compactPosition ?? position, away ?? ORIGIN, away ? LABEL_OFFSET : 0)}>
      <SceneLabel mobile={mobile} className={`${className} ${styles.compactLabel}`}>
        {compactText ?? children}
      </SceneLabel>
    </Html>
  );
};

const decCentroid = (starPos) => [(2 * starPos[0]) / 3, starPos[1] / 3, (2 * starPos[2]) / 3];
const raCentroid = (starPos) => [starPos[0] / 3, 0, (2 * starPos[2]) / 3];

const RightAscension = ({ starPos, showZ, highlight, step }) => (
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
    <Tag position={[starPos[0] / 2, 0, starPos[2] / 2]} away={raCentroid(starPos)} mobile={step === 3 || step === 4} className={highlight === 'h' || highlight === 'all' ? styles.highlightLabel : ''}>h</Tag>
    <Tag position={[starPos[0] / 2, 0, starPos[2]]} away={raCentroid(starPos)} mobile={step === 3} className={highlight === 'x' || highlight === 'all' ? styles.highlightLabel : ''}>x</Tag>
    {showZ && (
      <Tag position={[0, 0, starPos[2] / 2]} away={raCentroid(starPos)} mobile={step === 4} className={highlight === 'z' || highlight === 'all' ? styles.highlightLabel : ''}>z</Tag>
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

const Declination = ({ starPos, showHorizontalRadius, highlight, step }) => {
  return (
    <>
      <Tag position={[starPos[0] / 2, starPos[1] / 2, starPos[2] / 2]} away={decCentroid(starPos)} mobile={step === 1}>r = 1</Tag>
      <Tag position={[starPos[0], starPos[1] / 2, starPos[2]]} away={decCentroid(starPos)} mobile={step === 1 || step === 5} className={highlight === 'y' || highlight === 'all' ? styles.highlightLabel : ''}>y</Tag>
      {showHorizontalRadius && (
        <Tag position={[starPos[0] / 2, 0, starPos[2] / 2]} away={decCentroid(starPos)} mobile={step === 2} className={highlight === 'h' || highlight === 'all' ? styles.highlightLabel : ''}>h</Tag>
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
  step,
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
  // On phones the middle of the Dec arc sits right beside the y label, so the
  // compact label moves up the arc, near the star.
  const decLabelCompact = decPoints[Math.round(steps * 0.85)];

  return (
    <>
      {showRightAscension && (
        <>
          <Line points={raPoints} color={highlight === 'ra' || highlight === 'all' ? 'gold' : 'deepskyblue'} lineWidth={2} />
          <Tag position={raLabel} away={ORIGIN} mobile={step === 3 || step === 4} className={`${styles.arcLabel} ${highlight === 'ra' || highlight === 'all' ? styles.highlightLabel : ''}`}>RA</Tag>
        </>
      )}
      {showDeclination && (
        <>
          <Line points={decPoints} color={highlight === 'dec' || highlight === 'all' ? 'gold' : 'orchid'} lineWidth={2} />
          <Tag position={decLabel} compactPosition={decLabelCompact} away={ORIGIN} mobile={step === 1 || step === 2} className={`${styles.arcLabel} ${highlight === 'dec' || highlight === 'all' ? styles.highlightLabel : ''}`}>Dec</Tag>
        </>
      )}
    </>
  );
};

const CameraRig = ({ step, rightAscensionAngle, distanceScale = 1 }) => {
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
  const position = new THREE.Vector3(...views[step]).multiplyScalar(distanceScale);
  const duration =
    { 0: 1.2, 1: 0.8, 2: 0.8, 3: 1.2, 4: 0.8, 5: 1 }[step] ?? 1.2;
  const viewKey = `${step}:${distanceScale}`;

  if (transition.current.key !== viewKey) {
    transition.current = {
      key: viewKey,
      start: new THREE.Spherical().setFromVector3(camera.position),
      target: new THREE.Spherical().setFromVector3(position),
      elapsed: 0,
    };
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useFrame((_, delta) => {
    if (transition.current.elapsed >= duration) return;

    if (prefersReducedMotion) {
      camera.position.copy(position);
      camera.lookAt(0, 0, 0);
      transition.current.elapsed = duration;
      return;
    }

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

const ModelGrid = ({ gridSize, step }) => {
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
        <div className={`${styles.axisLabel} ${styles.mobileSceneLabel} ${step === 3 || step === 4 || step === 5 ? styles.mobileSceneLabelActive : ''}`}>+X</div>
      </Html>
      <Html position={[-(lineSize + 0.1), 0, 0]}>
        <div className={`${styles.axisLabel} ${styles.mobileSceneLabel} ${step === 3 || step === 4 || step === 5 ? styles.mobileSceneLabelActive : ''}`}>-X</div>
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
        <div className={`${styles.axisLabel} ${styles.mobileSceneLabel} ${step === 1 || step === 5 ? styles.mobileSceneLabelActive : ''}`}>-Y</div>
      </Html>
      <Html position={[0, lineSize + 0.5, 0]}>
        <div className={`${styles.axisLabel} ${styles.mobileSceneLabel} ${step === 1 || step === 5 ? styles.mobileSceneLabelActive : ''}`}>+Y</div>
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
        <div className={`${styles.axisLabel} ${styles.mobileSceneLabel} ${step === 4 || step === 5 ? styles.mobileSceneLabelActive : ''}`}>-Z</div>
      </Html>
      <Html position={[0, 0, lineSize + 0.1]}>
        <div className={`${styles.axisLabel} ${styles.mobileSceneLabel} ${step === 4 || step === 5 ? styles.mobileSceneLabelActive : ''}`}>+Z</div>
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

const Star = ({ starPos, step }) => {
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
      <Tag position={starPos} away={ORIGIN} mobile={step === 5} compactText='Star'>
        Star [{starPos.map((coordinate) => coordinate.toFixed(2)).join(', ')}]
      </Tag>
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
  variant = 'panel',
  targets = [],
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

  const renderFields = (fieldStep) => (
    <>
        {(fieldStep === 0 || fieldStep >= 3) && (
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
        {(fieldStep <= 2 || fieldStep === 5) && (
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
        {fieldStep === 1 && (
          <>
            <div className={styles.equation}>Given: r = 1</div>
            <div className={styles.equation}>sin(Dec) = y / r</div>
            <div className={styles.equation}>sin(Dec) = y / 1</div>
            <div className={styles.equation}>
              y = sin(Dec) = {starPos[1].toFixed(2)}
            </div>
          </>
        )}
        {fieldStep === 2 && (
          <>
            <div className={styles.equation}>cos(Dec) = h / r</div>
            <div className={styles.equation}>cos(Dec) = h / 1</div>
            <div className={styles.equation}>
              h = cos(Dec) = {horizontalRadius.toFixed(2)}
            </div>
          </>
        )}
        {fieldStep === 3 && (
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
        {fieldStep === 4 && (
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
        {fieldStep === 5 && (
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
    </>
  );

  const panels = (
    <>
          <div className={`${styles.controlsContainer} ${step === 0 ? styles.panelEnter : ''}`}>
            <div className={styles.stepTitle}>{stage}</div>
            {renderFields(step)}
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
          <div className={styles.wireframeParent}>
            <div className={`${styles.controlsContainer} ${step === 0 ? styles.panelEnter : ''}`}>
              <label className={styles.toggle}>
                <input
                  type='checkbox'
                  checked={showSphere}
                  onChange={(event) => setShowSphere(event.target.checked)}
                />
                Show sphere wireframe
              </label>
            </div>
          </div>
    </>
  );

  if (variant === 'inline') {
    // Phones (design C): every step card gets its own controls, so card heights
    // never change while scrolling. All of them drive the same model state.
    return targets.map(({ step: cardStep, element }) =>
      createPortal(
        <div className={styles.inlineControls}>{renderFields(cardStep)}</div>,
        element,
        `controls-${cardStep}`,
      ),
    );
  }

  return <div className={styles.controllerParent}>{panels}</div>;
};

const PointLabels = ({ starPos, step }) => (
  <>
    <Tag position={[0, 0, 0]} away={decCentroid(starPos)} mobile={step === 1 || step === 2}>Origin</Tag>
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[0.02, 32, 32]} />
      <meshStandardMaterial color='black' />
    </mesh>
    <Tag position={[starPos[0], 0, starPos[2]]} away={ORIGIN} mobile={step === 2}>XZ projection</Tag>
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
  controlsTargets = [],
}) => {
  const gridSize = 4;
  const starRadius = 1;
  const [declinationAngle, setDeclinationAngle] = useState(Math.PI / 6);
  const [rightAscensionAngle, setRightAscensionAngle] = useState(Math.PI / 4);
  const [showSphere, setShowSphere] = useState(true);
  const isMobile = useIsMobile();
  const mobilePresentation = presentation && isMobile;
  const [canvasReady, setCanvasReady] = useState(false);
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
  };
  const highlight = highlights[step] ?? {};
  // Phones: steps 0-4 are scroll-only so swipes on the model scroll the page;
  // step 5 is the playground where orbiting turns on.
  const orbitEnabled = mobilePresentation ? step === 5 : step === 0 || step === 5;

  return (
    <div
      className={`${styles.container} ${stacked ? styles.stacked : ''} ${
        presentation ? styles.presentation : ''
      } ${mobilePresentation && !orbitEnabled ? styles.touchScrolls : ''}`}
    >
      <Canvas
        camera={{ position: [-1.8, 0.51, 1.8] }}
        className={`${styles.canvas} ${canvasReady ? styles.canvasReady : ''}`}
        onCreated={() => requestAnimationFrame(() => requestAnimationFrame(() => setCanvasReady(true)))}
      >
        <CompactLabelsContext.Provider value={mobilePresentation}>
        <CameraRig
          step={step}
          rightAscensionAngle={rightAscensionAngle}
          distanceScale={mobilePresentation ? MOBILE_CAMERA_DISTANCE : 1}
        />
        <ModelGrid gridSize={gridSize} step={step} />
        <PointLabels starPos={starPos} step={step} />
        {(step === 0 || step <= 2 || step === 5) && (
          <Declination
            starPos={starPos}
            showHorizontalRadius={step === 0 || step >= 2}
            highlight={highlight.declination}
            step={step}
          />
        )}
        {(step === 0 || step >= 3) && (
          <RightAscension
            starPos={starPos}
            showZ={step === 0 || step >= 4}
            highlight={highlight.rightAscension}
            step={step}
          />
        )}
        <AngleArcs
          starRadius={starRadius}
          declinationAngle={declinationAngle}
          rightAscensionAngle={rightAscensionAngle}
          showRightAscension={step === 0 || step >= 3}
          showDeclination={step === 0 || step <= 2 || step === 5}
          highlight={highlight.arc}
          step={step}
        />
        {(step === 0 || step <= 2 || step === 5) && <Star starPos={starPos} step={step} />}
        {showSphere && <CelestialSphere />}
        <OrbitControls enabled={orbitEnabled} enableZoom={false} />
        </CompactLabelsContext.Provider>
      </Canvas>
      {mobilePresentation && (
        <label className={styles.wireframeToggle}>
          <input
            type='checkbox'
            checked={showSphere}
            onChange={(event) => setShowSphere(event.target.checked)}
          />
          Wireframe
        </label>
      )}
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
          variant={mobilePresentation ? 'inline' : 'panel'}
          targets={controlsTargets}
        />
      )}
    </div>
  );
};

export default StarMapModel;
