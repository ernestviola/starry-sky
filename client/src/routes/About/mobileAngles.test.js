import { expect, test } from 'vitest';
import { mobileAngles } from './mobileAngles.js';

const degrees = (radians) => radians * 180 / Math.PI;

test('mobile declination sweeps both poles, then settles at the equator for RA', () => {
  expect(degrees(mobileAngles(1, 0).declination)).toBe(90);
  expect(degrees(mobileAngles(1, 1).declination)).toBe(-90);
  expect(degrees(mobileAngles(2, 0).declination)).toBe(-90);
  expect(degrees(mobileAngles(2, 0.85).declination)).toBeCloseTo(90);
  expect(degrees(mobileAngles(2, 1).declination)).toBe(0);
  expect(degrees(mobileAngles(3, 0).declination)).toBe(0);
});

test('each right-ascension step completes a full turn in either scroll direction', () => {
  for (const step of [3, 4]) {
    expect(degrees(mobileAngles(step, 0).rightAscension)).toBe(0);
    expect(degrees(mobileAngles(step, 0.5).rightAscension)).toBe(180);
    expect(degrees(mobileAngles(step, 1).rightAscension)).toBe(360);
    expect(mobileAngles(step, 0.25).rightAscension).toBeLessThan(mobileAngles(step, 0.75).rightAscension);
    expect(mobileAngles(step, 0.5).declination).toBe(0);
  }
});
