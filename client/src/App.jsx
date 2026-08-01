import { Canvas, useFrame } from '@react-three/fiber';
import { Line, Html, Grid, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useRef } from 'react';

const ModelGrid = () => {
  const gridSize = 1;
  const lineSize = gridSize / 2;
  return (
    <>
      <color attach='background' args={['#323232']} />
      <Grid
        args={[gridSize, gridSize, gridSize]}
        side={THREE.DoubleSide}
        cellSize={0.1}
        cellColor='#2080ff'
        cellThickness={1}
      />
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
      <Html position={[0, lineSize + 0.1, 0]}>
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

const CameraDirectionTracker = () => {
  const lastLogTime = useRef(0);

  useFrame((state) => {
    const direction = new THREE.Vector3();
    state.camera.getWorldDirection(direction);
    const now = Date.now();
    if (now - lastLogTime.current > 500) {
      console.log(direction.x, direction.y, direction.z);
      lastLogTime.current = now;
    }
  });

  return null;
};

const App = () => {
  return (
    <div className='' style={{ height: '100vh', width: '100vw' }}>
      <Canvas camera={{ position: [0, 0.1, 0] }}>
        <ModelGrid />
        <OrbitControls />
        <CameraDirectionTracker />
      </Canvas>
    </div>
  );
};

export default App;
