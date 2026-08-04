import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, Html, Grid, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useRef, useState, useEffect, useMemo } from 'react';

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
  const lastRa = useRef(null);
  const lastDec = useRef(null);
  const threshold = 0.05;

  const angularDifference = (a, b) => {
    let diff = a - b;
    // wrap into (-π, π]
    diff = ((diff + Math.PI) % (2 * Math.PI)) - Math.PI;
    return Math.abs(diff);
  };

  useFrame((state) => {
    const direction = new THREE.Vector3();

    state.camera.getWorldDirection(direction);

    const dec = Math.asin(direction.y);
    const ra = Math.atan2(direction.x, direction.z);

    const changed =
      lastRa.current === null ||
      angularDifference(ra, lastRa.current) > threshold ||
      Math.abs(dec - lastDec.current) > threshold;

    if (changed) {
      setDec(dec);
      setRa(ra);
      lastDec.current = dec;
      lastRa.current = ra;
    }
  });

  return null;
};

const FovZoomControls = () => {
  const { camera, gl } = useThree();

  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();
      const newFov = THREE.MathUtils.clamp(
        camera.fov + e.deltaY * 0.05,
        10,
        90,
      );
      camera.fov = newFov;
      camera.updateProjectionMatrix();
    };

    gl.domElement.addEventListener('wheel', handleWheel, { passive: false });
    return () => gl.domElement.removeEventListener('wheel', handleWheel);
  }, [camera, gl]);

  return null;
};

const Star3dObjects = ({ stars }) => {
  const starArray = useMemo(() => Object.values(stars), [stars]);

  const positions = useMemo(() => {
    const arr = new Float32Array(starArray.length * 3);

    starArray.forEach((star, i) => {
      const x = Math.cos(star.decrad) * Math.sin(star.rarad);
      const y = Math.sin(star.decrad);
      const z = Math.cos(star.decrad) * Math.cos(star.rarad);
      arr[i * 3] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z;
    });

    return arr;
  }, [starArray]);

  return (
    <points>
      <bufferGeometry key={starArray.length}>
        <bufferAttribute
          attach='attributes-position'
          count={starArray.length}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.005} color={'white'} />
    </points>
  );
};

const App = () => {
  // default geolocaiton NYC
  const [currentGeolocation, setCurrentGeolocation] = useState({
    latitude: 40.73061,
    longitude: -73.935242,
  });

  const [ra, setRa] = useState(0);
  const [dec, setDec] = useState(0);
  const [stars, setStars] = useState({});

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

  useEffect(() => {
    const fetchStarFrame = async () => {
      try {
        const url = new URL(`${import.meta.env.VITE_STAR_API}api/stars/frame`);
        url.searchParams.append('ra', ra);
        url.searchParams.append('dec', dec);
        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error('Problems fetching star data.');
        }

        const data = await response.json();
        const newStars = {};
        for (const star of data.frame) {
          newStars[star.id] = star;
        }
        setStars((prev) => ({ ...prev, ...newStars }));
      } catch (error) {
        console.log(error);
      }
    };

    fetchStarFrame();
  }, [ra, dec]);

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
          enableZoom={false}
        />
        <ConstellationAnglesBasedOnCamera setDec={setDec} setRa={setRa} />
        <ZenithTargetDirection zenith={zenith} />
        <Star3dObjects stars={stars} />
        <FovZoomControls />
      </Canvas>
    </div>
  );
};

export default App;
