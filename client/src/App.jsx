import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, Html, Grid, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useRef, useState, useEffect } from 'react';

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

const ZenithTargetDirection = ({ zenith }) => {
  return (
    <mesh>
      <Line
        points={[
          [0, 0, 0],
          [zenith[0] * 3, zenith[1] * 3, zenith[2] * 3],
        ]}
        color='yellow'
      />
    </mesh>
  );
};

const ConstellationAnglesBasedOnCamera = ({ setDec, setRa }) => {
  useFrame((state) => {
    const direction = new THREE.Vector3();

    state.camera.getWorldDirection(direction);

    const dec = Math.asin(direction.y);
    const ra = Math.atan2(direction.z, direction.x);

    setDec(dec);
    setRa(ra);
  });

  return null;
};

const App = () => {
  // default geolocaiton NYC
  const [currentGeolocation, setCurrentGeolocation] = useState({
    latitude: 40.73061,
    longitude: -73.935242,
  });

  const [ra, setRa] = useState(0);
  const [dec, setDec] = useState(0);

  const [zenith, setZenith] = useState([0, 0, 0.1]);

  useEffect(() => {
    getUserGeolocation();
  }, []);

  useEffect(() => {
    const milliSecInADay = 1000 * 60 * 60 * 24;
    const daysSinceJan2000 =
      (Date.now() - new Date(2000, 0, 1)) / milliSecInADay;

    const GMST = 280.46061837 + 360.98564736629 * daysSinceJan2000;

    const LST = GMST + currentGeolocation.longitude;

    const zenithDec = (currentGeolocation.latitude * Math.PI) / 180;
    const zenithRa = (LST * Math.PI) / 180;

    const zenithX = Math.cos(zenithDec) * Math.sin(zenithRa);
    const zenithY = Math.sin(zenithDec);
    const zenithZ = Math.cos(zenithDec) * Math.cos(zenithRa);

    setDec(zenithDec);
    setRa(zenithRa);
    setZenith([zenithX, zenithY, zenithZ]);
  }, [currentGeolocation]);

  const getUserGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setCurrentGeolocation({
          latitude,
          longitude,
        });
      });
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className='' style={{ height: '100vh', width: '100vw' }}>
      <Canvas camera={{ position: [0, 0, 0] }}>
        <ModelGrid />
        <OrbitControls
          target={[zenith[0] * 0.01, zenith[1] * 0.01, zenith[2] * 0.01]} // just in front of camera, not at camera's exact position
          minDistance={0.01}
          maxDistance={0.01} // locks camera-to-target distance, so it can only rotate, never zoom/move
          enablePan={false} // prevents dragging the target (and thus the "look point") away
        />
        <ConstellationAnglesBasedOnCamera setDec={setDec} setRa={setRa} />
        <ZenithTargetDirection zenith={zenith} />
      </Canvas>
    </div>
  );
};

export default App;
