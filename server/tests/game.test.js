import { jest } from '@jest/globals';
import request from 'supertest';

process.env.PASSPORT_JS_SECRET = 'test-secret';

let session;
let leaderboardEntries;
const prismaMock = {
  $queryRaw: jest.fn(),
  $transaction: jest.fn((callback) => callback(prismaMock)),
  gameSession: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  leaderboard: { create: jest.fn() },
};

jest.unstable_mockModule('../libs/prisma.js', () => ({ prisma: prismaMock }));
const { default: app } = await import('../app.js');

beforeEach(() => {
  jest.clearAllMocks();
  session = null;
  leaderboardEntries = [];
  prismaMock.$queryRaw.mockResolvedValue([
    { id: 1, proper: 'Sirius' }, { id: 2, proper: 'Polaris' },
  ]);
  prismaMock.gameSession.create.mockImplementation(async ({ data }) => {
    session = {
      id: 'session-1', targetStarIds: data.targetStarIds, foundStarIds: [],
      startedAt: new Date(Date.now() - 1000), finishedAt: null,
      totalTimeMs: null, savedAt: null,
    };
    return session;
  });
  prismaMock.gameSession.findUnique.mockImplementation(async () => session);
  prismaMock.gameSession.update.mockImplementation(async ({ data }) => {
    session.foundStarIds.push(data.foundStarIds.push);
    return session;
  });
  prismaMock.gameSession.updateMany.mockImplementation(async ({ where, data }) => {
    if (where.finishedAt === null && session.finishedAt) return { count: 0 };
    if (where.savedAt === null && session.savedAt) return { count: 0 };
    Object.assign(session, data);
    return { count: 1 };
  });
  prismaMock.leaderboard.create.mockImplementation(async ({ data }) => {
    const entry = { id: leaderboardEntries.length + 1, ...data };
    leaderboardEntries.push(entry);
    return entry;
  });
});

const startGame = async () => {
  const response = await request(app).post('/api/game/start').expect(201);
  return response.body.token;
};
const select = (token, starId) => request(app).post('/api/game/select')
  .set('Authorization', `Bearer ${token}`).send({ starId });
const finish = (token) => request(app).post('/api/game/submit')
  .set('Authorization', `Bearer ${token}`);
const save = (token, data) => request(app).post('/api/game/submit/name')
  .set('Authorization', `Bearer ${token}`).send(data);

test('cannot finish until every target has been selected by the server', async () => {
  const token = await startGame();
  await finish(token).expect(409);
  expect((await select(token, 99).expect(200)).body.found).toBe(false);
  await select(token, 1).expect(200);
  await finish(token).expect(409);
  await select(token, 2).expect(200);
  const result = await finish(token).expect(201);
  expect(result.body.token).toBeTruthy();
  expect(session.totalTimeMs).toBeGreaterThanOrEqual(0);
});

test('a completed score can be saved only once', async () => {
  const token = await startGame();
  await select(token, 1).expect(200);
  await select(token, 2).expect(200);
  const scoreToken = (await finish(token).expect(201)).body.token;
  await save(token, { name: 'Wrong token' }).expect(403);
  await save(scoreToken, { name: 'Ada', latitude: 0, longitude: 0 }).expect(201);
  await save(scoreToken, { name: 'Again' }).expect(409);
  expect(leaderboardEntries).toHaveLength(1);
  expect(leaderboardEntries[0]).toMatchObject({ name: 'Ada', geoLat: 0, geoLong: 0 });
});

test.each(['', '             ', 'a'.repeat(13)])('rejects invalid name %j', async (name) => {
  const token = await startGame();
  await select(token, 1).expect(200);
  await select(token, 2).expect(200);
  const scoreToken = (await finish(token).expect(201)).body.token;
  await save(scoreToken, { name }).expect(400);
  expect(leaderboardEntries).toHaveLength(0);
});
