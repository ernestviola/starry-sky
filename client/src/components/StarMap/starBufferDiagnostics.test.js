import { describe, expect, test } from 'vitest';
import {
  getStarBufferDropReport,
  getStarRenderDiagnostic,
} from './starBufferDiagnostics.js';

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

  test('reports a hoverable star that has no visible render-buffer entry', () => {
    expect(
      getStarRenderDiagnostic(
        { id: 17, healpixId: 52, mag: 3.4 },
        {
          bufferIndex: undefined,
          drawCount: 120000,
          bufferCapacity: 120000,
          size: null,
          fade: null,
          globalOpacity: 1,
          color: null,
        },
      ),
    ).toEqual({
      starId: 17,
      frameId: 52,
      magnitude: 3.4,
      bufferIndex: null,
      isInDrawRange: false,
      drawCount: 120000,
      bufferCapacity: 120000,
      size: null,
      fade: null,
      globalOpacity: 1,
      effectiveOpacity: null,
      color: null,
    });
  });

  test('reports visible-star attributes and their effective opacity', () => {
    expect(
      getStarRenderDiagnostic(
        { id: 18, healpixId: 53, mag: 2.1 },
        {
          bufferIndex: 41,
          drawCount: 100,
          bufferCapacity: 120000,
          size: 8,
          fade: 0.5,
          globalOpacity: 0.8,
          color: [1, 0.9, 0.7],
        },
      ),
    ).toMatchObject({
      isInDrawRange: true,
      effectiveOpacity: 0.4,
      size: 8,
      color: [1, 0.9, 0.7],
    });
  });
});
