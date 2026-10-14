import request from 'supertest';
import app from '../app.js';

describe('GET /api/game/leaderboard', () => {
  test('returns the leaderboard root endpoint', async () => {
    const response = await request(app).get('/api/game/leaderboard/').expect(200);
    expect(response.body).toEqual({ success: true });
  });

  test('rejects an invalid page', async () => {
    const response = await request(app)
      .get('/api/game/leaderboard/global?page=-2').expect(400);
    expect(response.body.success).toBe(false);
  });

  test('returns 404 for a missing leaderboard entry', async () => {
    const response = await request(app)
      .get('/api/game/leaderboard/global?leaderboardId=2147483647').expect(404);
    expect(response.body.message).toBe('Leaderboard entry not found.');
  });
});
