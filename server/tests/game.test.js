import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.PASSPORT_JS_SECRET = 'test-secret';

const prismaMock = {
  leaderboard: {
    create: jest.fn(),
  },
};

jest.unstable_mockModule('../libs/prisma.js', () => ({
  prisma: prismaMock,
}));

const { default: app } = await import('../app.js');

describe('POST /api/game/submit/name', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates a leaderbaoard entry without writing to the database', async () => {
    prismaMock.leaderboard.create.mockResolvedValue({
      id: 42,
      name: 'Ernest',
      totalTimeMiliseconds: 1234,
      geoLat: 10,
      geoLong: 20,
    });

    const token = jwt.sign({ totalTime: 1234 }, process.env.PASSPORT_JS_SECRET);

    const response = await request(app)
      .post('/api/game/submit/name')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Ernest',
        latitude: 10,
        longitude: 20,
      })
      .expect(201);

    expect(response.body).toEqual({
      success: true,
      leaderboardId: 42,
    });

    expect(prismaMock.leaderboard.create).toHaveBeenCalledWith({
      data: {
        name: 'Ernest',
        totalTimeMiliseconds: 1234,
        geoLat: 10,
        geoLong: 20,
      },
    });
  });
});
