import request from 'supertest';
import app from '../app.js';

describe('GET /api/stars success', () => {
  let response;

  beforeAll(async () => {
    response = await request(app).get('/api/stars/frame?frames=2').expect(200);
  });

  test('returns stars for a frame', () => {
    expect(response.body.success).toBe(true);
  });

  test('returns a json object response', () => {
    expect(response.body).toEqual(
      expect.objectContaining({
        count: expect.any(Number),
        frameIds: expect.any(Array),
        stars: expect.any(Array),
        success: true,
      }),
    );
  });

  test('returns a proper star object', () => {
    for (const star of response.body.stars) {
      expect(typeof star.ci === 'number' || star.ci === null).toBe(true);
      expect(typeof star.hip === 'number' || star.hip === null).toBe(true);
      expect(star).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          healpixId: expect.any(Number),
          rarad: expect.any(Number),
          decrad: expect.any(Number),
          x: expect.any(Number),
          y: expect.any(Number),
          z: expect.any(Number),
          mag: expect.any(Number),
          proper: expect.any(String),
          con: expect.any(String),
        }),
      );
    }
  });
});
