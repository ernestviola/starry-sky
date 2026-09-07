import request from 'supertest';
import app from '../app.js';

describe('GET /api/game/leaderboard', () => {
  describe('response successful tests', () => {
    test('returns valid root endpoint', async () => {
      const response = await request(app)
        .get('/api/game/leaderboard/')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
      });
    });

    test('');
  });

  describe('response unsuccessful tests', () => {
    test('unsuccessful after invalid id', async () => {
      const response = await request(app)
        .get('/api/game/leaderboard?page=-2')
        .expect(400);
    });
    test('unsuccessful after invalid star', async () => {
      const response = await request(app)
        .get('/api/game/leaderboard?page=-2')
        .expect(400);
    });
  });
});
