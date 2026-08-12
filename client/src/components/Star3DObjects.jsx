import * as THREE from 'three';

import { useState, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

const MAX_STARS = 120000;
const MAG_EXPONENT = 1.5;
const MIN_MAG = -1.44;
const MAX_MAG = 6;
const SIZE_SCALE = 40;

const starVertexShader = `
  attribute float size;
  attribute vec3 color;
  varying vec3 vColor;
  varying float vSize;

  void main() {
    vColor = color;
    vSize = size;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = `
  varying vec3 vColor;
  varying float vSize;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    float alpha = 1.0 - (dist / 0.5);
    gl_FragColor = vec4(vColor, alpha);
  }
`;

const Star3dObjects = ({ stars, viewedFrames }) => {
  // currently processed star
  const nextIndexRef = useRef(0);

  // star attribute arrays
  const positionRef = useRef(new Float32Array(MAX_STARS * 3));
  const colorRef = useRef(new Float32Array(MAX_STARS * 3));
  const sizeRef = useRef(new Float32Array(MAX_STARS));

  // star attribute references
  const positionAttrRef = useRef();
  const colorAttrRef = useRef();
  const sizeAttrRef = useRef();
  const geometryRef = useRef();

  // ref tracking all prev hovered stars used for easing animation
  const visitedStarsRef = useRef(new Map());

  // maps for quick lookup
  const idToIndexRef = useRef(new Map());
  const raycastIndexToIdRef = useRef();

  // most recent pointer location
  const pointerXRef = useRef();
  const pointerYRef = useRef();

  // the currently hovered star. starId or null
  const [currentStarId, setCurrentStarId] = useState(null);

  // three js objects used for object detection
  const { pointer, camera } = useThree();
  const raycasterRef = useRef(new THREE.Raycaster());
  const raycastPointsRef = useRef(); // points object passed to the raycaster

  const indicatorRingMeshRef = useRef([0.3, 0.3, 0.3]);

  // initialize raycaster threshold
  useEffect(() => {
    raycasterRef.current.params.Points.threshold = 0.03;
  }, []);

  const starColor = (ci) => {
    if (ci === null || ci === undefined) {
      return new THREE.Color('white');
    }

    const t = THREE.MathUtils.clamp((ci + 0.4) / 2.4, 0, 1);

    const stops = [
      { t: 0.0, color: new THREE.Color(0.6, 0.7, 1.0) }, // hot blue
      { t: 0.4, color: new THREE.Color(1.0, 1.0, 1.0) }, // white
      { t: 0.6, color: new THREE.Color(1.0, 0.9, 0.7) }, // yellow-white (Sun-like)
      { t: 1.0, color: new THREE.Color(1.0, 0.5, 0.3) }, // cool red
    ];

    for (let i = 0; i < stops.length - 1; i++) {
      if (t >= stops[i].t && t <= stops[i + 1].t) {
        const localT = (t - stops[i].t) / (stops[i + 1].t - stops[i].t);
        return stops[i].color.clone().lerp(stops[i + 1].color, localT);
      }
    }
    return stops[stops.length - 1].color;
  };

  const starSize = (mag) => {
    // Values from sql max: 21, min: -26.7

    if (mag === null || mag === undefined) {
      mag = MAX_MAG;
    }

    return Math.abs((mag - MAX_MAG - 1) / (MIN_MAG - MAX_MAG - 1));
  };

  const starPosition = (decrad, rarad) => {
    const x = Math.cos(decrad) * Math.sin(rarad);
    const y = Math.sin(decrad);
    const z = Math.cos(decrad) * Math.cos(rarad);
    return { x, y, z };
  };

  // draw stars with position, color, and size
  useEffect(() => {
    const idToIndex = idToIndexRef.current;
    const positions = positionRef.current;
    const colors = colorRef.current;
    const sizes = sizeRef.current;

    let changed = false;

    for (const star of Object.values(stars)) {
      if (idToIndex.has(star.id)) continue;

      const index = nextIndexRef.current;
      if (index >= MAX_STARS) {
        console.warn('Star buffer is full, dropping star', star.id);
        continue;
      }

      const position = starPosition(star.decrad, star.rarad);
      positions[index * 3] = position.x;
      positions[index * 3 + 1] = position.y;
      positions[index * 3 + 2] = position.z;

      const color = starColor(star.ci);
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;

      if (star.mag >= 6) {
        sizes[index] = 0;
      } else {
        const normalized = starSize(star.mag);
        const shaped = Math.pow(normalized, MAG_EXPONENT);
        sizes[index] = shaped * SIZE_SCALE;
      }

      idToIndex.set(star.id, index);
      nextIndexRef.current += 1;
      changed = true;
    }

    if (
      changed &&
      positionAttrRef.current &&
      colorAttrRef.current &&
      sizeAttrRef.current &&
      geometryRef.current
    ) {
      positionAttrRef.current.needsUpdate = true;
      colorAttrRef.current.needsUpdate = true;
      sizeAttrRef.current.needsUpdate = true;
      geometryRef.current.setDrawRange(0, nextIndexRef.current);
      geometryRef.current.computeBoundingSphere();
    }
  }, [stars]);

  useEffect(() => {
    if (raycastPointsRef.current) {
      raycastPointsRef.current.geometry.dispose();
    }

    const buffer = new THREE.BufferGeometry();
    const filteredStars = Object.values(stars).filter(
      (star) =>
        star.mag <= MAX_MAG &&
        star.mag >= MIN_MAG &&
        viewedFrames.has(star.healpixId),
    );

    // viewedPointsRef to get passed to the raycaster
    // bufferGeometry for this new list of points

    const positionArr = new Float32Array(filteredStars.length * 3);
    const smallIndexToId = new Map();

    // create float32buffer and add x,y,z positions
    for (let i = 0; i < filteredStars.length; i++) {
      const position = starPosition(
        filteredStars[i].decrad,
        filteredStars[i].rarad,
      );
      positionArr[i * 3] = position.x;
      positionArr[i * 3 + 1] = position.y;
      positionArr[i * 3 + 2] = position.z;

      smallIndexToId.set(i, filteredStars[i].id);
    }

    buffer.setAttribute('position', new THREE.BufferAttribute(positionArr, 3));

    const raycastPoints = new THREE.Points(buffer);
    raycastPointsRef.current = raycastPoints;
    raycastIndexToIdRef.current = smallIndexToId;
  }, [stars, viewedFrames]);

  // returns null if hovering over empty space. returns the hovered star in all other cases
  const hoveredStar = () => {
    if (!raycastPointsRef.current) return; // there is no list of points to do raycasting on
    if (pointer.x === pointerXRef.current && pointer.y === pointerYRef.current)
      return currentStarId; // the mouse hasn't moved so we should keep the previous value of whatever we're looking at

    pointerXRef.current = pointer.x;
    pointerYRef.current = pointer.y;

    const raycaster = raycasterRef.current; // raycaster object from THREE js
    const raycastIndexToId = raycastIndexToIdRef.current; // map from the hidden raycast

    raycaster.setFromCamera(pointer, camera);

    const objects = raycaster.intersectObject(raycastPointsRef.current);

    // no available objects to set star to so we're looking at empty space
    if (objects.length === 0) {
      setCurrentStarId(null);
      indicatorRingMeshRef.current.position.set(0, 0, 0);
      return null;
    }

    const closest = objects.reduce((best, current) => {
      return current.distanceToRay < best.distanceToRay ? current : best;
    });

    const objectIndex = closest.index;

    const starId = raycastIndexToId.get(objectIndex);
    setCurrentStarId(starId);
    const positionsIndex = idToIndexRef.current.get(starId);
    const positions = positionRef.current;

    indicatorRingMeshRef.current.position.set(
      positions[positionsIndex * 3],
      positions[positionsIndex * 3 + 1],
      positions[positionsIndex * 3 + 2],
    );
    indicatorRingMeshRef.current.lookAt(camera.position);
    return starId;
  };

  const visitedStarManager = (starId) => {
    const visitedStars = visitedStarsRef.current;
    const idToIndex = idToIndexRef.current;
    const sizes = sizeRef.current;

    if (starId !== null && !visitedStars.has(starId)) {
      // check if
      // just decrease all visitedStars
      // add the star with it's initial size and index
      const MAX_SCALER = 2;
      const MAX_SIZE = 70;
      const MIN_SIZE = 25;

      const index = idToIndex.get(starId);

      const calculatedSize = sizes[index] * MAX_SCALER;

      visitedStars.set(starId, {
        index,
        initial_size: sizes[index],
        max_size: Math.min(Math.max(calculatedSize, MIN_SIZE), MAX_SIZE),
      });
    }

    const EASING_SCALER = 0.15;

    for (const [starId, attributes] of visitedStars) {
      if (
        currentStarId === starId &&
        sizes[attributes.index] < attributes.max_size
      ) {
        sizes[attributes.index] +=
          (attributes.max_size - sizes[attributes.index]) * EASING_SCALER;
      } else if (sizes[attributes.index] > attributes.initial_size) {
        sizes[attributes.index] -=
          (sizes[attributes.index] - attributes.initial_size) * EASING_SCALER;
      } else {
        delete visitedStars.delete(starId);
      }
      sizeAttrRef.current.needsUpdate = true;
    }
  };

  useFrame((state) => {
    const starId = hoveredStar();
    visitedStarManager(starId);
  });

  return (
    <>
      <mesh ref={indicatorRingMeshRef} renderOrder={2}>
        <ringGeometry args={[0.028, 0.03, 30]} />
        <meshBasicMaterial
          color='#fff'
          side={THREE.DoubleSide}
          depthTest={false}
        />
      </mesh>

      <points renderOrder={1}>
        <bufferGeometry ref={geometryRef}>
          <bufferAttribute
            ref={positionAttrRef}
            attach='attributes-position'
            count={MAX_STARS}
            array={positionRef.current}
            itemSize={3}
          />
          <bufferAttribute
            ref={colorAttrRef}
            attach='attributes-color'
            count={MAX_STARS}
            array={colorRef.current}
            itemSize={3}
          />
          <bufferAttribute
            ref={sizeAttrRef}
            attach='attributes-size'
            count={MAX_STARS}
            array={sizeRef.current}
            itemSize={1}
          />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={starVertexShader}
          fragmentShader={starFragmentShader}
          depthTest={false}
          transparent={true}
        />
      </points>
    </>
  );
};

export default Star3dObjects;
