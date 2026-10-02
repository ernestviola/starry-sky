import { afterEach, describe, expect, test } from 'vitest';
import { getMotionDuration } from './motion.js';

describe('getMotionDuration', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--test-motion-duration');
  });

  test('reads millisecond and second CSS time tokens', () => {
    document.documentElement.style.setProperty('--test-motion-duration', '250ms');
    expect(getMotionDuration('--test-motion-duration')).toBe(250);

    document.documentElement.style.setProperty('--test-motion-duration', '0.5s');
    expect(getMotionDuration('--test-motion-duration')).toBe(500);
  });

  test('uses the fallback for missing or invalid tokens', () => {
    expect(getMotionDuration('--missing-motion-token', 180)).toBe(180);
    document.documentElement.style.setProperty('--test-motion-duration', 'slow');
    expect(getMotionDuration('--test-motion-duration', 180)).toBe(180);
  });
});
