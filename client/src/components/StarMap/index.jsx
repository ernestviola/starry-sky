import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, Html, Grid, CameraControls } from '@react-three/drei';
import * as THREE from 'three';
import { useRef, useState, useEffect } from 'react';

import { ang2vec, query_disc_inclusive_ring } from '@hscmap/healpix';
import { nside } from './config.js';

import Star3dObjects from './Star3dObjects.jsx';
import ConstellationLines from './ConstellationLines.jsx';
import useStarFrameLoader from './hooks/useStarFrameLoader.js';
import useConstellationFrameLoader from './hooks/useConstellationFrameLoader.js';

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

const MAX_QUERY_RADIUS = Math.PI / 2 - 0.001;

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

    const newRadius = Math.min(
      cornerRadius + bufferMargin,
      MAX_QUERY_RADIUS,
    );

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

const CanvasClick = ({ handleClick, hoveredStarId }) => {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const handleCanvasClick = (event) => {
      if (event.sourceCapabilities?.firesTouchEvents) return;
      handleClick(hoveredStarId);
    };
    canvas.addEventListener('click', handleCanvasClick);
    return () => canvas.removeEventListener('click', handleCanvasClick);
  }, [gl, handleClick, hoveredStarId]);
};

const SmoothCameraTarget = ({ controlsRef, zenith }) => {
  const { camera } = useThree();

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const target = new THREE.Vector3(zenith[0], zenith[1], zenith[2])
      .normalize()
      .multiplyScalar(0.01);

    controls.setLookAt(
      camera.position.x,
      camera.position.y,
      camera.position.z,
      target.x,
      target.y,
      target.z,
      true,
    );
  }, [camera, controlsRef, zenith]);

  return null;
};

const StarMap = ({
  hoveredStarId,
  setHoveredStarId,
  setSelectedStarId,
  handleClick,
  enableHover = true,
}) => {
  const [canvasReady, setCanvasReady] = useState(false);
  const { constellationLinesDictionary, loadConstellationFrames } =
    useConstellationFrameLoader();
  const {
    starsDictionary,
    receivedHealpixIds,
    pendingStars,
    loadStarFrames,
    consumePendingStars,
  } = useStarFrameLoader();

  // default geolocaiton NYC
  // nyc lat: 40.73061 long: -73.935242

  // san diego 33.13208N, 116.21170 W
  const [currentGeolocation, setCurrentGeolocation] = useState({
    latitude: 40.73061,
    longitude: -73.935242,
  });

  const [radius, setRadius] = useState(0.5);

  const [ra, setRa] = useState(0);
  const [dec, setDec] = useState(0);

  const [viewedFrames, setViewedFrames] = useState(new Set());
  const [zenith, setZenith] = useState([0, 0, 0.1]);

  const orbitControlRef = useRef();
  const pendingFrameIdsRef = useRef(new Set());

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

    const requestedFrames = new Set(
      [...frameIds].filter(
        (frameId) =>
          !receivedHealpixIds.has(frameId) &&
          !pendingFrameIdsRef.current.has(frameId),
      ),
    );
    if (requestedFrames.size === 0) return;

    for (const frameId of requestedFrames) {
      pendingFrameIdsRef.current.add(frameId);
    }

    const loadFrames = async () => {
      try {
        const starsLoaded = await loadStarFrames(requestedFrames);
        if (starsLoaded) await loadConstellationFrames(requestedFrames);
      } finally {
        for (const frameId of requestedFrames) {
          pendingFrameIdsRef.current.delete(frameId);
        }
      }
    };

    loadFrames();
  }, [
    ra,
    dec,
    radius,
    receivedHealpixIds,
    loadStarFrames,
    loadConstellationFrames,
  ]);

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
    <div
      className=''
      style={{ height: '100vh', width: '100vw', position: 'relative' }}
    >
      <Canvas
        camera={{ position: [0, 0, 0], fov: 50 }}
        onCreated={() => requestAnimationFrame(() => requestAnimationFrame(() => setCanvasReady(true)))}
        style={{ opacity: canvasReady ? 1 : 0, transition: 'opacity 500ms ease' }}
      >
        <color attach='background' args={['#000000']} />
        {/* <ModelGrid /> */}
        <CameraControls
          ref={orbitControlRef}
          smoothTime={0.5}
          azimuthRotateSpeed={0.3}
          polarRotateSpeed={0.3}
          minDistance={0.01}
          maxDistance={0.01}
        />
        <SmoothCameraTarget controlsRef={orbitControlRef} zenith={zenith} />
        <ConstellationAnglesBasedOnCamera setDec={setDec} setRa={setRa} />
        <ZenithTargetDirection zenith={zenith} />
        <FovZoomControls />
        <FrustumRadiusTracker setRadius={setRadius} />
        <Star3dObjects
          starsDictionary={starsDictionary}
          viewedFrames={viewedFrames}
          hoveredStarId={hoveredStarId}
          setHoveredStarId={setHoveredStarId}
          enableHover={enableHover}
          pendingStars={pendingStars}
          consumePendingStars={consumePendingStars}
          setSelectedStarId={setSelectedStarId}
          handleClick={handleClick}
        />
        <ConstellationLines
          constellationLinesDictionary={constellationLinesDictionary}
        />
        <CanvasClick handleClick={handleClick} hoveredStarId={hoveredStarId} />
      </Canvas>
    </div>
  );
};

export default StarMap;
