import request from 'supertest';
import app from '../app.js';

/**
 * test success request
 * test unsuccess request
 * test shape
 */

describe('GET /api/constellation/frame', () => {
  let response;

  describe('with valid frames', () => {
    beforeAll(async () => {
      response = await request(app)
        .get('/api/constellations/frame?frames=2')
        .expect(200);
    });

    test('returns a success', () => {
      expect(response.body.success).toEqual(true);
    });

    test('returns a frame in proper shape', () => {
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          constellations: expect.any(Array),
          constellationLines: expect.any(Array),
        }),
      );
    });

    test('returns valid constellation lines', async () => {
      const response = await request(app)
        .get('/api/constellations/frame?frames=2')
        .expect(200);

      for (const line of response.body.constellationLines) {
        expect(line).toEqual(
          expect.objectContaining({
            id: expect.any(Number),
            constellationName: expect.any(String),
            lineIndex: expect.any(Number),
            pointIndex: expect.any(Number),
            healpixId: expect.any(Number),
          }),
        );
      }
    });
  });

  describe('filters received constellations', () => {
    test('excludes received constellations', async () => {
      const response = await request(app)
        .get(
          '/api/constellations/frame?frames=2&receivedConstellationNames=Little%20Bear',
        )
        .expect(200);
      console.log(response.body);
      expect(response.body.constellationLines.length === 0).toBe(true);
    });
  });

  describe('with invalid frames', () => {
    test('rejects a request without frames', async () => {
      const response = await request(app)
        .get('/api/constellations/frame')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
    test('rejects a request with an invalid frame value', async () => {
      const response = await request(app)
        .get('/api/constellations/frame?frame=abc')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
