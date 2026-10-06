import * as THREE from 'three';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import StarPoints from './StarPoints.jsx';
import StarIndicator from './StarIndicator.jsx';
import useStarHover from './hooks/useStarHover.js';
import { getStarPosition } from './starPosition.js';
import {
  getStarClickIndicatorColor,
  getStarClickIndicatorOpacity,
} from './starClickIndicator.js';

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

const makeGlowTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(64, 64, 2, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(244, 238, 228, 0.95)');
  gradient.addColorStop(0.13, 'rgba(194, 141, 255, 0.8)');
  gradient.addColorStop(0.48, 'rgba(194, 141, 255, 0.24)');
  gradient.addColorStop(1, 'rgba(194, 141, 255, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
};

const pointerFromEvent = (canvas, event) => {
  const rect = canvas.getBoundingClientRect();
  return new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );
};

export const CanvasClick = ({ handleClick, handleInteraction, pickStar }) => {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    const handleCanvasClick = (event) => {
      if (event.sourceCapabilities?.firesTouchEvents) return;

      const starId = pickStar(pointerFromEvent(canvas, event));

      if (starId !== null && starId !== undefined) {
        handleInteraction?.('star');
      }
      handleClick?.(starId);
    };

    canvas.addEventListener('click', handleCanvasClick);
    return () => canvas.removeEventListener('click', handleCanvasClick);
  }, [gl, handleClick, handleInteraction, pickStar]);

  return null;
};

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
  starClickFeedback = null,
  handleClick = null,
  handleInteraction = null,
  searchTarget = null,
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

  const { pointer, camera, gl } = useThree();
  const pointerOverCanvasRef = useRef(false);

  useEffect(() => {
    if (!enableHover) return undefined;
    const trackPointerSurface = (event) => {
      const overCanvas = event.target === gl.domElement;
      if (pointerOverCanvasRef.current && !overCanvas) setHoveredStarId?.(null);
      pointerOverCanvasRef.current = overCanvas;
    };
    window.addEventListener('pointermove', trackPointerSurface);
    return () => window.removeEventListener('pointermove', trackPointerSurface);
  }, [enableHover, gl, setHoveredStarId]);

  const indicatorRingMeshRef = useRef();
  const starMaterialRef = useRef();
  const searchGlowRef = useRef();
  const shouldFadeInRef = useRef(false);
  const initialStarsLoadedRef = useRef(false);
  const fadingStarIndicesRef = useRef(new Set());
  const starBufferInitializedRef = useRef(false);
  const uniforms = useMemo(() => ({ globalOpacity: { value: 0 } }), []);
  const glowTexture = useMemo(() => makeGlowTexture(), []);

  useEffect(() => () => glowTexture.dispose(), [glowTexture]);

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
    const focusedStar = searchTarget?.type === 'star' ? searchTarget.star : null;
    const starsToProcess = starBufferInitializedRef.current
      ? [...pendingStars, ...(focusedStar ? [focusedStar] : [])]
      : [...Object.values(starsDictionary), ...pendingStars, ...(focusedStar ? [focusedStar] : [])];
    starBufferInitializedRef.current = true;

    for (const star of starsToProcess) {
      if (idToIndex.has(star.id)) continue;
      if (!Number.isFinite(star.decrad) || !Number.isFinite(star.rarad)) continue;

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
  }, [starsDictionary, pendingStars, consumePendingStars, searchTarget]);

  const visitedStarManager = (starId) => {
    const visitedStars = visitedStarsRef.current;
    const idToIndex = idToIndexRef.current;
    const sizes = sizeRef.current;

    if (starId !== null && !visitedStars.has(starId)) {
      const MAX_SCALER = 2;
      const MAX_SIZE = 70;
      const MIN_SIZE = 25;

      const index = idToIndex.get(starId);
      if (index === undefined) return;

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
    const starId = enableHover && pointerOverCanvasRef.current ? detectHoveredStar() : null;

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
      const indicatorStarId = starClickFeedback?.starId ?? starId;
      indicatorRingMeshRef.current.visible = indicatorStarId !== null && indicatorStarId !== undefined;
      if (indicatorStarId === null || indicatorStarId === undefined) {
        indicatorRingMeshRef.current.visible = false;
      } else {
        const index = idToIndexRef.current.get(indicatorStarId);
        if (index !== undefined) {
          const positions = positionRef.current;
          indicatorRingMeshRef.current.position.set(
            positions[index * 3],
            positions[index * 3 + 1],
            positions[index * 3 + 2],
          );
          indicatorRingMeshRef.current.lookAt(camera.position);
        } else {
          indicatorRingMeshRef.current.visible = false;
        }
      }

      indicatorRingMeshRef.current.scale.set(
        camera.fov / 100,
        camera.fov / 100,
        camera.fov / 100,
      );
      indicatorRingMeshRef.current.material.color.set(
        getStarClickIndicatorColor(starClickFeedback?.status),
      );
      indicatorRingMeshRef.current.material.opacity = starClickFeedback
        ? getStarClickIndicatorOpacity(
            starClickFeedback.expiresAt,
            performance.now(),
            starClickFeedback.duration,
          )
        : 1;
    }
    if (searchGlowRef.current) {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const pulse = reducedMotion ? 0.72 : 0.65 + 0.12 * Math.sin(performance.now() / 450);
      searchGlowRef.current.material.opacity = pulse;
    }
    visitedStarManager(starId);
  });

  const TouchStarSelection = () => {
    const { gl } = useThree();
    const gestureRef = useRef(null);

    useEffect(() => {
      if (!setSelectedStarId) return;
      const canvas = gl.domElement;

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

        const starId = pickStar(pointerFromEvent(canvas, event));
        setSelectedStarId(starId);
        if (starId !== null && starId !== undefined) {
          handleInteraction?.('star');
        }
        handleClick?.(starId);
      };

      canvas.addEventListener('pointerdown', handlePointerDown);
      canvas.addEventListener('pointerup', handlePointerUp);
      return () => {
        canvas.removeEventListener('pointerdown', handlePointerDown);
        canvas.removeEventListener('pointerup', handlePointerUp);
      };
    }, [gl]);
    return null;
  };

  const focusedPosition = searchTarget?.type === 'star' &&
    Number.isFinite(searchTarget.star?.decrad) &&
    Number.isFinite(searchTarget.star?.rarad)
    ? getStarPosition(searchTarget.star.decrad, searchTarget.star.rarad)
    : null;

  return (
    <>
      {setSelectedStarId && <TouchStarSelection />}
      <CanvasClick
        handleClick={handleClick}
        handleInteraction={handleInteraction}
        pickStar={pickStar}
      />
      {enableHover && <StarIndicator indicatorRef={indicatorRingMeshRef} />}

      {focusedPosition && (
          <sprite
            ref={searchGlowRef}
            position={[focusedPosition.x, focusedPosition.y, focusedPosition.z]}
            scale={[0.075, 0.075, 1]}
            renderOrder={1}
          >
            <spriteMaterial
              map={glowTexture}
              color='#ffffff'
              transparent
              depthTest={false}
              blending={THREE.AdditiveBlending}
            />
          </sprite>
        )}

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
