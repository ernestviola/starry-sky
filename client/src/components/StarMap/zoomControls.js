import * as THREE from 'three';

const MIN_FOV = 10;
const MAX_FOV = 90;
const WHEEL_ZOOM_SENSITIVITY = 0.05;

const applyFovDelta = (camera, delta) => {
  camera.fov = THREE.MathUtils.clamp(camera.fov + delta, MIN_FOV, MAX_FOV);
  camera.updateProjectionMatrix();
};

const getDistance = (first, second) =>
  Math.hypot(first.x - second.x, first.y - second.y);

export const attachZoomControls = (canvas, camera, onZoom) => {
  const pointers = new Map();
  let previousPinchDistance = null;

  const handleWheel = (event) => {
    event.preventDefault();
    applyFovDelta(camera, event.deltaY * WHEEL_ZOOM_SENSITIVITY);
    onZoom?.();
  };

  const handlePointerDown = (event) => {
    if (event.pointerType !== 'touch') return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    previousPinchDistance = pointers.size === 2
      ? getDistance(...pointers.values())
      : null;
  };

  const handlePointerMove = (event) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size !== 2) return;

    const distance = getDistance(...pointers.values());
    if (previousPinchDistance !== null) {
      // Moving the fingers apart zooms in, just like a negative wheel delta.
      applyFovDelta(
        camera,
        (previousPinchDistance - distance) * WHEEL_ZOOM_SENSITIVITY,
      );
      onZoom?.();
    }
    previousPinchDistance = distance;
  };

  const handlePointerEnd = (event) => {
    pointers.delete(event.pointerId);
    previousPinchDistance = pointers.size === 2
      ? getDistance(...pointers.values())
      : null;
  };

  canvas.addEventListener('wheel', handleWheel, { passive: false });
  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', handlePointerEnd);
  canvas.addEventListener('pointercancel', handlePointerEnd);

  return () => {
    canvas.removeEventListener('wheel', handleWheel);
    canvas.removeEventListener('pointerdown', handlePointerDown);
    canvas.removeEventListener('pointermove', handlePointerMove);
    canvas.removeEventListener('pointerup', handlePointerEnd);
    canvas.removeEventListener('pointercancel', handlePointerEnd);
  };
};
