import request from 'supertest';
import app from '../app.js';

describe('GET /api/game/leaderboard', () => {
  test('returns success', async () => {
    const response = await request(app)
      .get('/api/game/leaderboard/')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
    });
  });
});
