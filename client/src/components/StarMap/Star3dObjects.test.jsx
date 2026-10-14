import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { CanvasClick } from './Star3dObjects.jsx';
import {
  getStarClickIndicatorColor,
  getStarClickIndicatorOpacity,
} from './starClickIndicator.js';

const mapMock = vi.hoisted(() => ({ canvas: null }));

vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn(),
  useThree: () => ({ gl: { domElement: mapMock.canvas } }),
}));

describe('CanvasClick', () => {
  beforeEach(() => {
    mapMock.canvas = document.createElement('canvas');
    vi.spyOn(mapMock.canvas, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
    });
  });

  test('uses click coordinates so a blank tap does not select a stale star', () => {
    const pickStar = vi.fn(() => null);
    const handleClick = vi.fn();
    const handleInteraction = vi.fn();

    render(
      <CanvasClick
        pickStar={pickStar}
        handleClick={handleClick}
        handleInteraction={handleInteraction}
      />,
    );

    fireEvent.click(mapMock.canvas, { clientX: 50, clientY: 50 });

    expect(pickStar).toHaveBeenCalledWith(expect.objectContaining({ x: 0, y: 0 }));
    expect(handleClick).toHaveBeenCalledWith(null);
    expect(handleInteraction).not.toHaveBeenCalled();
  });
});

describe('star click indicator colors', () => {
  test('uses success and danger colors for correct and incorrect stars', () => {
    expect(getStarClickIndicatorColor('correct')).toBe('#8fe3b0');
    expect(getStarClickIndicatorColor('incorrect')).toBe('#ff8f9f');
    expect(getStarClickIndicatorColor(null)).toBe('#fff');
  });
});

describe('star click indicator fade', () => {
  test('fades smoothly to transparent over the feedback duration', () => {
    expect(getStarClickIndicatorOpacity(300, 0, 300)).toBe(1);
    expect(getStarClickIndicatorOpacity(300, 150, 300)).toBe(0.25);
    expect(getStarClickIndicatorOpacity(300, 300, 300)).toBe(0);
    expect(getStarClickIndicatorOpacity(300, 400, 300)).toBe(0);
    expect(getStarClickIndicatorOpacity(0, 0, 0)).toBe(0);
  });
});
