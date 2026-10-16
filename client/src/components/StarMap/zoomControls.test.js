import { describe, expect, test, vi } from 'vitest';
import { attachZoomControls } from './zoomControls.js';

const pointerEvent = (type, { pointerId, clientX, clientY, pointerType = 'touch' }) => {
  const event = new Event(type);
  Object.assign(event, { pointerId, clientX, clientY, pointerType });
  return event;
};

const makeCamera = (fov = 50) => ({
  fov,
  updateProjectionMatrix: vi.fn(),
});

describe('star map zoom controls', () => {
  test('pinching outward zooms in and pinching inward zooms out', () => {
    const canvas = document.createElement('canvas');
    const camera = makeCamera();
    const onZoom = vi.fn();
    const detach = attachZoomControls(canvas, camera, onZoom);

    canvas.dispatchEvent(pointerEvent('pointerdown', { pointerId: 1, clientX: 10, clientY: 20 }));
    canvas.dispatchEvent(pointerEvent('pointerdown', { pointerId: 2, clientX: 110, clientY: 20 }));
    canvas.dispatchEvent(pointerEvent('pointermove', { pointerId: 2, clientX: 130, clientY: 20 }));

    expect(camera.fov).toBe(49);
    expect(camera.updateProjectionMatrix).toHaveBeenCalledTimes(1);
    expect(onZoom).toHaveBeenCalledTimes(1);

    canvas.dispatchEvent(pointerEvent('pointermove', { pointerId: 2, clientX: 110, clientY: 20 }));
    expect(camera.fov).toBe(50);
    expect(camera.updateProjectionMatrix).toHaveBeenCalledTimes(2);

    detach();
  });

  test('desktop wheel scrolling continues to zoom and remains non-passive', () => {
    const canvas = document.createElement('canvas');
    const camera = makeCamera();
    const onZoom = vi.fn();
    const detach = attachZoomControls(canvas, camera, onZoom);
    const event = new WheelEvent('wheel', { deltaY: 100, cancelable: true });

    canvas.dispatchEvent(event);

    expect(camera.fov).toBe(55);
    expect(camera.updateProjectionMatrix).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
    expect(onZoom).toHaveBeenCalledTimes(1);

    detach();
  });

  test('keeps the camera FOV inside the existing limits for both input types', () => {
    const canvas = document.createElement('canvas');
    const camera = makeCamera(10);
    const detach = attachZoomControls(canvas, camera);

    canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: -1000, cancelable: true }));
    expect(camera.fov).toBe(10);

    canvas.dispatchEvent(pointerEvent('pointerdown', { pointerId: 1, clientX: 0, clientY: 0 }));
    canvas.dispatchEvent(pointerEvent('pointerdown', { pointerId: 2, clientX: 100, clientY: 0 }));
    canvas.dispatchEvent(pointerEvent('pointermove', { pointerId: 2, clientX: 200, clientY: 0 }));
    expect(camera.fov).toBe(10);

    detach();
  });
});
