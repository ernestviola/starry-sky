import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { INDICATOR_OUTER_RADIUS } from './StarIndicator.jsx';

const SEGMENT_COUNT = 128;
const SPHERE_RADIUS = 1.001;
const FADE_DURATION_FALLBACK = 180;
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const WORLD_RIGHT = new THREE.Vector3(1, 0, 0);

const readMotionSettings = () => {
  const styles = getComputedStyle(document.documentElement);
  // const durationToken = styles.getPropertyValue('--duration-long').trim();
  const durationToken = '1000ms';
  const durationValue = Number.parseFloat(durationToken);
  const duration = durationToken.endsWith('ms')
    ? durationValue
    : durationToken.endsWith('s')
      ? durationValue * 1000
      : 500;
  const fadeToken = styles.getPropertyValue('--duration-slow').trim();
  const fadeValue = Number.parseFloat(fadeToken);
  const fadeDuration = fadeToken.endsWith('ms')
    ? fadeValue
    : fadeToken.endsWith('s')
      ? fadeValue * 1000
      : FADE_DURATION_FALLBACK;
  const easingToken = styles.getPropertyValue('--ease-standard').trim();
  const easingValues = easingToken
    .match(/cubic-bezier\(([^)]+)\)/)?.[1]
    .split(',')
    .map(Number);

  return {
    duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 0
      : duration,
    fadeDuration: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 0
      : fadeDuration,
    easing: easingValues?.length === 4 ? easingValues : [0.16, 1, 0.3, 1],
  };
};

const cubicBezierCoordinate = (t, p1, p2) =>
  3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3;

const cubicBezierDerivative = (t, p1, p2) =>
  3 * (1 - t) ** 2 * p1 + 6 * (1 - t) * t * (p2 - p1) + 3 * t ** 2 * (1 - p2);

const applyEasing = (progress, [x1, y1, x2, y2]) => {
  let t = progress;
  for (let index = 0; index < 5; index += 1) {
    const error = cubicBezierCoordinate(t, x1, x2) - progress;
    const derivative = cubicBezierDerivative(t, x1, x2);
    if (Math.abs(derivative) < 0.0001) break;
    t = THREE.MathUtils.clamp(t - error / derivative, 0, 1);
  }
  return cubicBezierCoordinate(t, y1, y2);
};

const getViewportCornerAngle = (camera, size) => {
  const halfVerticalFov = THREE.MathUtils.degToRad(camera.fov / 2);
  const halfHeight = Math.tan(halfVerticalFov);
  const halfWidth = halfHeight * (size.width / size.height);
  return Math.atan(Math.hypot(halfWidth, halfHeight));
};

const SearchTargetTransition = ({
  position,
  sequence,
  completedSequence,
}) => {
  const { camera, size } = useThree();
  const animationRef = useRef({
    sequence: null,
    startedAt: 0,
    duration: 0,
    fadeDuration: 0,
    easing: null,
    active: false,
  });
  const targetPositionRef = useRef(new THREE.Vector3());
  const tangentXRef = useRef(new THREE.Vector3());
  const tangentYRef = useRef(new THREE.Vector3());
  const tangentRef = useRef(new THREE.Vector3());
  const pointRef = useRef(new THREE.Vector3());
  const x = position?.x;
  const y = position?.y;
  const z = position?.z;

  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(SEGMENT_COUNT * 3), 3),
    );
    const material = new THREE.LineBasicMaterial({
      color: '#f4eee4',
      transparent: true,
      opacity: 0.9,
      depthTest: false,
      toneMapped: false,
    });
    const ring = new THREE.LineLoop(geometry, material);
    ring.frustumCulled = false;
    ring.visible = false;
    ring.renderOrder = 2;
    return ring;
  }, []);

  useEffect(
    () => () => {
      line.geometry.dispose();
      line.material.dispose();
    },
    [line],
  );

  useEffect(() => {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      animationRef.current.active = false;
      animationRef.current.sequence = null;
      line.visible = false;
      return;
    }

    targetPositionRef.current.set(x, y, z).normalize();

    if (sequence !== completedSequence || sequence === 0) {
      animationRef.current.active = false;
      line.visible = false;
      return;
    }

    if (animationRef.current.sequence === sequence) return;

    const { duration, fadeDuration, easing } = readMotionSettings();
    animationRef.current = {
      sequence,
      startedAt: performance.now(),
      duration,
      fadeDuration,
      easing,
      active: duration > 0 || fadeDuration > 0,
    };
    line.material.opacity = 0.9;
    line.visible = duration > 0 || fadeDuration > 0;
  }, [completedSequence, line, sequence, x, y, z]);

  useFrame(() => {
    const animation = animationRef.current;
    if (!animation.active || !line.visible) return;

    const elapsed = performance.now() - animation.startedAt;
    const shrinkProgress =
      animation.duration > 0
        ? THREE.MathUtils.clamp(elapsed / animation.duration, 0, 1)
        : 1;
    const indicatorAngle = Math.asin(
      Math.min(INDICATOR_OUTER_RADIUS / SPHERE_RADIUS, 1),
    );
    const startAngle = getViewportCornerAngle(camera, size);
    const angle = THREE.MathUtils.lerp(
      startAngle,
      indicatorAngle,
      applyEasing(shrinkProgress, animation.easing),
    );
    const fadeProgress =
      animation.fadeDuration > 0
        ? THREE.MathUtils.clamp(
            (elapsed - animation.duration) / animation.fadeDuration,
            0,
            1,
          )
        : 1;
    const target = targetPositionRef.current;
    const reference = Math.abs(target.y) < 0.99 ? WORLD_UP : WORLD_RIGHT;
    const tangentX = tangentXRef.current
      .crossVectors(target, reference)
      .normalize();
    const tangentY = tangentYRef.current
      .crossVectors(target, tangentX)
      .normalize();
    const tangent = tangentRef.current;
    const point = pointRef.current;
    const positions = line.geometry.getAttribute('position');
    const points = positions.array;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);

    for (let index = 0; index < SEGMENT_COUNT; index += 1) {
      const theta = (index / SEGMENT_COUNT) * Math.PI * 2;
      tangent
        .copy(tangentX)
        .multiplyScalar(Math.cos(theta))
        .addScaledVector(tangentY, Math.sin(theta));
      point
        .copy(target)
        .multiplyScalar(cosine)
        .addScaledVector(tangent, sine)
        .multiplyScalar(SPHERE_RADIUS);
      const offset = index * 3;
      points[offset] = point.x;
      points[offset + 1] = point.y;
      points[offset + 2] = point.z;
    }

    positions.needsUpdate = true;
    line.material.opacity =
      0.9 * (1 - applyEasing(fadeProgress, animation.easing));
    if (fadeProgress >= 1) {
      animation.active = false;
      line.visible = false;
    }
  });

  return <primitive object={line} />;
};

export default SearchTargetTransition;
