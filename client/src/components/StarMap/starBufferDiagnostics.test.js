import { describe, expect, test } from 'vitest';
import { getStarBufferDropReport } from './starBufferDiagnostics.js';

describe('star buffer diagnostics', () => {
  test('groups dropped stars by source frame and reports buffer and batch counts', () => {
    expect(
      getStarBufferDropReport(
        [
          { id: 10, healpixId: 42 },
          { id: 11, healpixId: 42 },
          { id: 12, healpixId: 43 },
          { id: 13 },
        ],
        { bufferCount: 120000, maxStars: 120000, pendingStarCount: 8 },
      ),
    ).toEqual({
      bufferCount: 120000,
      maxStars: 120000,
      pendingStarCount: 8,
      droppedCount: 4,
      dropsByFrame: { 42: 2, 43: 1, unknown: 1 },
    });
  });
});
