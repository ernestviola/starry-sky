import * as THREE from 'three';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import StarPoints from './StarPoints.jsx';
import StarIndicator from './StarIndicator.jsx';
import useStarHover from './hooks/useStarHover.js';
import { getStarPosition } from './starPosition.js';

const MAX_STARS = 120000;
const MAG_EXPONENT = 1.5;
const MIN_MAG = -1.44;
const MAX_MAG = 6;
const SIZE_SCALE = 40;
const STAR_FADE_DURATION = 0.4;
const BATCH_FADE_DURATION = 0.4;
const STAR_COLOR_STOPS = [
  { t: 0.0, color: new THREE.Color(0.6, 0.7, 1.0) },
  { t: 0.4, color: new THREE.Color(1.0, 1.0, 1.0) },
  { t: 0.6, color: new THREE.Color(1.0, 0.9, 0.7) },
  { t: 1.0, color: new THREE.Color(1.0, 0.5, 0.3) },
];

const setStarColor = (ci, target) => {
  if (ci === null || ci === undefined) return target.set('white');

  const t = THREE.MathUtils.clamp((ci + 0.4) / 2.4, 0, 1);

  for (let i = 0; i < STAR_COLOR_STOPS.length - 1; i++) {
    const start = STAR_COLOR_STOPS[i];
    const end = STAR_COLOR_STOPS[i + 1];

    if (t >= start.t && t <= end.t) {
      const amount = (t - start.t) / (end.t - start.t);
      return target.copy(start.color).lerp(end.color, amount);
    }
  }

  return target.copy(STAR_COLOR_STOPS.at(-1).color);
};

const Star3dObjects = ({
  starsDictionary,
  viewedFrames,
  hoveredStarId,
  setHoveredStarId = null,
  enableHover = true,
  pendingStars = [],
  consumePendingStars = null,
  setSelectedStarId = null,
  handleClick = null,
}) => {
  // currently processed star
  const nextIndexRef = useRef(0);

  // star attribute arrays
  const positionRef = useRef(new Float32Array(MAX_STARS * 3));
  const colorRef = useRef(new Float32Array(MAX_STARS * 3));
  const sizeRef = useRef(new Float32Array(MAX_STARS));
  const fadeRef = useRef(new Float32Array(MAX_STARS));

  // star attribute references
  const positionAttrRef = useRef();
  const colorAttrRef = useRef();
  const sizeAttrRef = useRef();
  const fadeAttrRef = useRef();
  const geometryRef = useRef();

  // ref tracking all prev hovered stars used for easing animation
  const visitedStarsRef = useRef(new Map());

  // maps for quick lookup
  const idToIndexRef = useRef(new Map());

  const { pointer, camera } = useThree();

  const indicatorRingMeshRef = useRef();
  const starMaterialRef = useRef();
  const shouldFadeInRef = useRef(false);
  const initialStarsLoadedRef = useRef(false);
  const fadingStarIndicesRef = useRef(new Set());
  const starBufferInitializedRef = useRef(false);
  const uniforms = useMemo(() => ({ globalOpacity: { value: 0 } }), []);

  useEffect(() => {
    if (enableHover) return;

    for (const attributes of visitedStarsRef.current.values()) {
      sizeRef.current[attributes.index] = attributes.initial_size;
    }
    visitedStarsRef.current.clear();
    if (sizeAttrRef.current) sizeAttrRef.current.needsUpdate = true;
  }, [enableHover]);

  const starSize = (mag) => {
    // Values from sql max: 21, min: -26.7

    if (mag === null || mag === undefined) {
      mag = MAX_MAG;
    }

    return Math.abs((mag - MAX_MAG - 1) / (MIN_MAG - MAX_MAG - 1));
  };

  const { detectHoveredStar, pickStar } = useStarHover({
    starsDictionary,
    viewedFrames,
    hoveredStarId,
    setHoveredStarId,
    pointer,
    camera,
  });

  // draw stars with position, color, and size
  useEffect(() => {
    const idToIndex = idToIndexRef.current;
    const positions = positionRef.current;
    const colors = colorRef.current;
    const sizes = sizeRef.current;
    const fades = fadeRef.current;

    let changed = false;
    const color = new THREE.Color();
    const starsToProcess = starBufferInitializedRef.current
      ? pendingStars
      : [...Object.values(starsDictionary), ...pendingStars];
    starBufferInitializedRef.current = true;

    for (const star of starsToProcess) {
      if (idToIndex.has(star.id)) continue;

      const index = nextIndexRef.current;
      if (index >= MAX_STARS) {
        console.warn('Star buffer is full, dropping star', star.id);
        continue;
      }

      const position = getStarPosition(star.decrad, star.rarad);
      positions[index * 3] = position.x;
      positions[index * 3 + 1] = position.y;
      positions[index * 3 + 2] = position.z;

      setStarColor(star.ci, color);
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

      if (initialStarsLoadedRef.current) {
        fades[index] = 0;
        fadingStarIndicesRef.current.add(index);
      } else {
        fades[index] = 1;
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
      fadeAttrRef.current &&
      geometryRef.current
    ) {
      positionAttrRef.current.needsUpdate = true;
      colorAttrRef.current.needsUpdate = true;
      sizeAttrRef.current.needsUpdate = true;
      fadeAttrRef.current.needsUpdate = true;
      geometryRef.current.setDrawRange(0, nextIndexRef.current);
      geometryRef.current.computeBoundingSphere();

      if (!initialStarsLoadedRef.current) {
        shouldFadeInRef.current = true;
        initialStarsLoadedRef.current = true;
      }
    }

    if (pendingStars.length > 0) {
      consumePendingStars?.(pendingStars.length);
    }
  }, [starsDictionary, pendingStars, consumePendingStars]);

  const visitedStarManager = (starId) => {
    const visitedStars = visitedStarsRef.current;
    const idToIndex = idToIndexRef.current;
    const sizes = sizeRef.current;

    if (starId !== null && !visitedStars.has(starId)) {
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
        hoveredStarId === starId &&
        sizes[attributes.index] < attributes.max_size
      ) {
        sizes[attributes.index] +=
          (attributes.max_size - sizes[attributes.index]) * EASING_SCALER;
      } else if (sizes[attributes.index] > attributes.initial_size) {
        sizes[attributes.index] -=
          (sizes[attributes.index] - attributes.initial_size) * EASING_SCALER;
      } else {
        visitedStars.delete(starId);
      }
      sizeAttrRef.current.needsUpdate = true;
    }
  };

  useFrame((_, delta) => {
    const starId = enableHover ? detectHoveredStar() : null;

    if (shouldFadeInRef.current && starMaterialRef.current) {
      const opacity = starMaterialRef.current.uniforms.globalOpacity;
      opacity.value = Math.min(opacity.value + delta / STAR_FADE_DURATION, 1);
    }

    const fadingStarIndices = fadingStarIndicesRef.current;
    if (fadingStarIndices.size > 0 && fadeAttrRef.current) {
      const fades = fadeRef.current;

      for (const index of fadingStarIndices) {
        fades[index] = Math.min(fades[index] + delta / BATCH_FADE_DURATION, 1);
        if (fades[index] === 1) fadingStarIndices.delete(index);
      }

      fadeAttrRef.current.needsUpdate = true;
    }

    if (indicatorRingMeshRef.current) {
      if (starId === null) {
        indicatorRingMeshRef.current.position.set(0, 0, 0);
      } else {
        const index = idToIndexRef.current.get(starId);
        if (index !== undefined) {
          const positions = positionRef.current;
          indicatorRingMeshRef.current.position.set(
            positions[index * 3],
            positions[index * 3 + 1],
            positions[index * 3 + 2],
          );
          indicatorRingMeshRef.current.lookAt(camera.position);
        }
      }

      indicatorRingMeshRef.current.scale.set(
        camera.fov / 100,
        camera.fov / 100,
        camera.fov / 100,
      );
    }
    visitedStarManager(starId);
  });

  const TouchStarSelection = () => {
    const { gl } = useThree();
    const gestureRef = useRef(null);

    useEffect(() => {
      if (!setSelectedStarId) return;
      const canvas = gl.domElement;

      const toPointer = (event) => {
        const rect = canvas.getBoundingClientRect();
        return new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1,
        );
      };

      const handlePointerDown = (event) => {
        if (event.pointerType === 'mouse') return;
        gestureRef.current = {
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
        };
      };

      const handlePointerUp = (event) => {
        const gesture = gestureRef.current;
        gestureRef.current = null;
        if (
          !gesture ||
          gesture.pointerId !== event.pointerId ||
          Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 10
        ) {
          return;
        }

        const starId = pickStar(toPointer(event));
        setSelectedStarId(starId);
        handleClick?.(starId);
      };

      canvas.addEventListener('pointerdown', handlePointerDown);
      canvas.addEventListener('pointerup', handlePointerUp);
      return () => {
        canvas.removeEventListener('pointerdown', handlePointerDown);
        canvas.removeEventListener('pointerup', handlePointerUp);
      };
    }, [gl, handleClick, pickStar, setSelectedStarId]);

    return null;
  };

  return (
    <>
      {setSelectedStarId && <TouchStarSelection />}
      {enableHover && <StarIndicator indicatorRef={indicatorRingMeshRef} />}

      <StarPoints
        positionRef={positionRef}
        colorRef={colorRef}
        sizeRef={sizeRef}
        fadeRef={fadeRef}
        geometryRef={geometryRef}
        positionAttrRef={positionAttrRef}
        colorAttrRef={colorAttrRef}
        sizeAttrRef={sizeAttrRef}
        fadeAttrRef={fadeAttrRef}
        starMaterialRef={starMaterialRef}
        uniforms={uniforms}
        maxStars={MAX_STARS}
      />
    </>
  );
};

export default Star3dObjects;
