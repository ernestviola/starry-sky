import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, Html, Grid, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useRef, useState, useEffect } from 'react';

import { ang2vec, query_disc_inclusive_ring } from '@hscmap/healpix';
import { nside } from './config.js';

import Star3dObjects from './Star3dObjects.jsx';
import ConstellationLines from './ConstellationLines.jsx';

const ModelGrid = () => {
  const gridSize = 1;
  const lineSize = gridSize / 2;
  return (
    <>
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

  const direction = useRef(new THREE.Vector3());

  const angularDifference = (a, b) => {
    let diff = a - b;
    // wrap into (-π, π]
    diff = ((diff + Math.PI) % (2 * Math.PI)) - Math.PI;
    return Math.abs(diff);
  };

  useFrame((state) => {
    state.camera.getWorldDirection(direction.current);

    const dec = Math.asin(direction.current.y);
    const ra = Math.atan2(direction.current.x, direction.current.z);

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
  const { camera, pointer, gl } = useThree();

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

const FrustumRadiusTracker = ({ setRadius }) => {
  const { camera, size } = useThree();

  const radius = useRef(null);
  const threshold = 0.02;

  useFrame(() => {
    const verticalFovRad = (camera.fov * Math.PI) / 180;
    const aspect = size.width / size.height;

    const halfHeight = Math.tan(verticalFovRad / 2);
    const halfWidth = halfHeight * aspect;

    const cornerRadius = Math.atan(Math.sqrt(halfWidth ** 2 + halfHeight ** 2));

    const bufferMargin = 0.3; // radians, adjust to taste

    const newRadius = cornerRadius + bufferMargin;

    const changed =
      radius.current === null ||
      Math.abs(radius.current - newRadius) > threshold;

    if (changed) {
      setRadius(newRadius);
      radius.current = newRadius;
    }
  });

  return null;
};

const StarMap = ({ hoveredStarId, setHoveredStarId }) => {
  // default geolocaiton NYC
  // nyc lat: 40.73061 long: -73.935242

  // 33.13208N, 116.21170 W
  const [currentGeolocation, setCurrentGeolocation] = useState({
    latitude: 40.73061,
    longitude: -73.935242,
  });

  const [radius, setRadius] = useState(0.5);

  const [ra, setRa] = useState(0);
  const [dec, setDec] = useState(0);
  const [stars, setStars] = useState({});
  const [constellationLines, setConstellationLines] = useState({});

  const [viewedFrames, setViewedFrames] = useState(new Set());
  const [receivedFrames, setReceivedFrames] = useState(new Set());
  const [receivedConstellations, setReceivedConstellations] = useState(
    new Set(),
  );
  const [zenith, setZenith] = useState([0, 0, 0.1]);

  const orbitControlRef = useRef();

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
    const theta = Math.PI / 2 - dec;
    const phi = ra;
    const v = ang2vec(theta, phi);
    const frameIds = new Set();
    query_disc_inclusive_ring(nside, v, radius, (ipix) => frameIds.add(ipix));

    setViewedFrames(frameIds);

    const requestedFrames = frameIds.difference(receivedFrames);
    if (requestedFrames.size === 0) return;

    const fetchStarFrame = async () => {
      try {
        const url = new URL(`${import.meta.env.VITE_STAR_API}api/stars/frame`);
        url.searchParams.append(
          'frames',
          Array.from(requestedFrames).join(','),
        );
        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error('Problems fetching star data.');
        }

        const data = await response.json();

        setReceivedFrames((prev) => new Set([...prev, ...data.frameIds]));

        setStars((prev) => {
          let hasNew = false;
          for (const star of data.stars) {
            if (!prev[star.id]) {
              hasNew = true;
              break;
            }
          }

          if (!hasNew) return prev;
          const next = { ...prev };
          for (const star of data.stars) {
            next[star.id] = star;
          }
          return next;
        });
      } catch (error) {
        console.log(error);
      }
    };

    const fetchConstellationFrame = async () => {
      try {
        const url = new URL(
          `${import.meta.env.VITE_STAR_API}api/constellations/frame`,
        );
        url.searchParams.append(
          'frames',
          Array.from(requestedFrames).join(','),
        );
        url.searchParams.append(
          'receivedConstellations',
          Array.from(receivedConstellations).join(','),
        );

        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error('Problems fetching star data.');
        }

        const data = await response.json();

        setReceivedConstellations(
          (prev) => new Set([...prev, ...data.constellations]),
        );

        setConstellationLines((prev) => {
          let hasNew = false;
          for (const line of data.constellationLines) {
            if (!prev[line.id]) {
              hasNew = true;
              break;
            }
          }

          if (!hasNew) return prev;
          const next = { ...prev };
          for (const line of data.constellationLines) {
            next[line.id] = line;
          }
          return next;
        });
      } catch (error) {
        console.log(error);
      }
    };

    fetchStarFrame();
    fetchConstellationFrame();
  }, [ra, dec, radius]);

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

  useEffect(() => {
    getUserGeolocation();
  }, []);

  return (
    <div className='' style={{ height: '100vh', width: '100vw' }}>
      <Canvas camera={{ position: [0, 0, 0] }}>
        <color attach='background' args={['#000000']} />
        {/* <ModelGrid /> */}
        <OrbitControls
          ref={orbitControlRef}
          rotateSpeed={0.3}
          target={[zenith[0] * 0.01, zenith[1] * 0.01, zenith[2] * 0.01]} // just in front of camera, not at camera's exact position
          minDistance={0.01}
          maxDistance={0.01} // locks camera-to-target distance, so it can only rotate, never zoom/move
          enablePan={false} // prevents dragging the target (and thus the "look point") away
          enableZoom={false}
        />
        <ConstellationAnglesBasedOnCamera setDec={setDec} setRa={setRa} />
        <ZenithTargetDirection zenith={zenith} />
        <FovZoomControls />
        <FrustumRadiusTracker setRadius={setRadius} />
        <Star3dObjects
          stars={stars}
          viewedFrames={viewedFrames}
          hoveredStarId={hoveredStarId}
          setHoveredStarId={setHoveredStarId}
        />
        <ConstellationLines constellationLines={constellationLines} />
      </Canvas>
    </div>
  );
};

export default StarMap;
