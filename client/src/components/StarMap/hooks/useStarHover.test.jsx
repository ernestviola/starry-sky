import * as THREE from 'three';
import { useEffect } from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import useStarHover from './useStarHover.js';

const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 10);
camera.position.set(0, 0, 2);
camera.lookAt(0, 0, 0);
camera.updateMatrixWorld();

const Probe = ({ onPickStar }) => {
  const { pickStar } = useStarHover({
    starsDictionary: { 7: { id: 7, mag: 0, decrad: 0, rarad: 0, healpixId: 1 } },
    viewedFrames: new Set([1]), hoveredStarId: null,
    setHoveredStarId: vi.fn(), pointer: new THREE.Vector2(0, 0), camera,
  });
  useEffect(() => onPickStar(pickStar), [onPickStar, pickStar]);
  return null;
};

afterEach(() => vi.useRealTimers());

test('raycasts a visible star at the pointer and ignores empty sky', () => {
  vi.useFakeTimers();
  const onPickStar = vi.fn();
  render(<Probe onPickStar={onPickStar} />);
  const [pickStar] = onPickStar.mock.calls.at(-1);
  act(() => vi.advanceTimersByTime(101));
  expect(pickStar(new THREE.Vector2(0, 0))).toBe(7);
  expect(pickStar(new THREE.Vector2(0.9, 0.9))).toBeNull();
});
