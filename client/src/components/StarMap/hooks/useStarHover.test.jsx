import * as THREE from 'three';
import { act, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import useStarHover from './useStarHover.js';

let pickStar;
const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 10);
camera.position.set(0, 0, 2);
camera.lookAt(0, 0, 0);
camera.updateMatrixWorld();

const Probe = () => {
  ({ pickStar } = useStarHover({
    starsDictionary: { 7: { id: 7, mag: 0, decrad: 0, rarad: 0, healpixId: 1 } },
    viewedFrames: new Set([1]), hoveredStarId: null,
    setHoveredStarId: vi.fn(), pointer: new THREE.Vector2(0, 0), camera,
  }));
  return null;
};

afterEach(() => vi.useRealTimers());

test('raycasts a visible star at the pointer and ignores empty sky', () => {
  vi.useFakeTimers();
  render(<Probe />);
  act(() => vi.advanceTimersByTime(101));
  expect(pickStar(new THREE.Vector2(0, 0))).toBe(7);
  expect(pickStar(new THREE.Vector2(0.9, 0.9))).toBeNull();
});
