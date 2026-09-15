import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, Html, Grid, CameraControls } from '@react-three/drei';
import * as THREE from 'three';
import { useRef, useState, useEffect, useCallback } from 'react';

import { ang2vec, query_disc_inclusive_ring } from '@hscmap/healpix';
import { nside } from './config.js';

import Star3dObjects from './Star3dObjects.jsx';
import ConstellationLines from './ConstellationLines.jsx';
import { useStarData } from '../../contexts/StarDataContext.jsx';

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

const CanvasClick = ({ handleClick }) => {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [handleClick]);
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
  handleClick,
  enableHover = true,
}) => {
  const {
    starsDictionary,
    setStarsDictionary,
    receivedHealpixIds,
    setReceivedHealpixIds,
    constellationLinesDictionary,
    setConstellationLinesDictionary,
    receivedConstellationNames,
    setReceivedConstellationNames,
  } = useStarData();

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
  const [pendingStars, setPendingStars] = useState([]);
  const knownStarIdsRef = useRef(new Set());

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

        setReceivedHealpixIds((prev) => new Set([...prev, ...requestedFrames]));

        const newStars = data.stars.filter((star) => {
          if (knownStarIdsRef.current.has(star.id)) return false;
          knownStarIdsRef.current.add(star.id);
          return true;
        });

        if (newStars.length > 0) {
          setPendingStars((prev) => [...prev, ...newStars]);
          setStarsDictionary((prev) => {
            const next = { ...prev };
            for (const star of newStars) next[star.id] = star;
            return next;
          });
        }
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
          'receivedConstellationNames',
          Array.from(receivedConstellationNames).join(','),
        );

        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error('Problems fetching star data.');
        }

        const data = await response.json();

        setReceivedConstellationNames(
          (prev) => new Set([...prev, ...data.constellations]),
        );

        setConstellationLinesDictionary((prev) => {
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

    const loadFrames = async () => {
      try {
        await Promise.all([fetchStarFrame(), fetchConstellationFrame()]);
      } finally {
        for (const frameId of requestedFrames) {
          pendingFrameIdsRef.current.delete(frameId);
        }
      }
    };

    loadFrames();
  }, [ra, dec, radius]);

  const consumePendingStars = useCallback((count) => {
    setPendingStars((prev) => prev.slice(count));
  }, []);

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
      <Canvas camera={{ position: [0, 0, 0] }}>
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
        />
        <ConstellationLines
          constellationLinesDictionary={constellationLinesDictionary}
        />
        <CanvasClick handleClick={handleClick} />
      </Canvas>
    </div>
  );
};

export default StarMap;
