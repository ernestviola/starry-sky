import * as THREE from 'three';
import { useCallback, useEffect, useRef } from 'react';
import { getStarPosition } from '../starPosition.js';

const MIN_MAG = -1.44;
const MAX_MAG = 6;
const RAYCAST_REBUILD_DELAY = 100;

const useStarHover = ({
  starsDictionary,
  viewedFrames,
  hoveredStarId,
  setHoveredStarId,
  pointer,
  camera,
}) => {
  const raycasterRef = useRef(new THREE.Raycaster());
  const raycastPointsRef = useRef();
  const raycastIndexToIdRef = useRef();
  const pointerXRef = useRef();
  const pointerYRef = useRef();

  useEffect(() => {
    raycasterRef.current.params.Points.threshold = 0.03;
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      raycastPointsRef.current?.geometry.dispose();

      const filteredStars = Object.values(starsDictionary).filter(
        (star) =>
          star.mag <= MAX_MAG &&
          star.mag >= MIN_MAG &&
          viewedFrames.has(star.healpixId),
      );
      const positionArr = new Float32Array(filteredStars.length * 3);
      const indexToId = new Map();

      for (let i = 0; i < filteredStars.length; i++) {
        const position = getStarPosition(
          filteredStars[i].decrad,
          filteredStars[i].rarad,
        );
        positionArr[i * 3] = position.x;
        positionArr[i * 3 + 1] = position.y;
        positionArr[i * 3 + 2] = position.z;
        indexToId.set(i, filteredStars[i].id);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positionArr, 3),
      );
      raycastPointsRef.current = new THREE.Points(geometry);
      raycastIndexToIdRef.current = indexToId;
    }, RAYCAST_REBUILD_DELAY);

    return () => clearTimeout(timeout);
  }, [starsDictionary, viewedFrames]);

  const detectHoveredStar = useCallback(() => {
    if (setHoveredStarId === null || !raycastPointsRef.current) return null;
    if (pointer.x === pointerXRef.current && pointer.y === pointerYRef.current) {
      return hoveredStarId;
    }

    pointerXRef.current = pointer.x;
    pointerYRef.current = pointer.y;

    raycasterRef.current.setFromCamera(pointer, camera);
    const intersections = raycasterRef.current.intersectObject(
      raycastPointsRef.current,
    );

    if (intersections.length === 0) {
      setHoveredStarId(null);
      return null;
    }

    const closest = intersections.reduce((best, current) =>
      current.distanceToRay < best.distanceToRay ? current : best,
    );

    const starId = raycastIndexToIdRef.current.get(closest.index) ?? null;
    setHoveredStarId(starId);
    return starId;
  }, [camera, hoveredStarId, pointer, setHoveredStarId]);

  return detectHoveredStar;
};

export default useStarHover;
