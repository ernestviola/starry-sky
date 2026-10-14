import jwt from 'jsonwebtoken';
import { body, validationResult, matchedData } from 'express-validator';
import { prisma } from '../libs/prisma.js';

const gameController = {};

const submitValidator = [
  body('name').isString().bail().trim().notEmpty()
    .withMessage('name is required').bail().isLength({ max: 12 })
    .withMessage('name must be at most 12 characters'),
  body('latitude').optional().isFloat({ min: -90, max: 90 }).toFloat(),
  body('longitude').optional().isFloat({ min: -180, max: 180 }).toFloat(),
];

const hasTokenKind = (req, kind) => req.user?.kind === kind &&
  typeof req.user.sessionId === 'string';

gameController.start = async (req, res, next) => {
  try {
    const starsToFind = await prisma.$queryRaw`
      select id, proper from hyg_stars where proper in ('Polaris', 'Sirius')
    `;
    if (starsToFind.length !== 2) {
      return res.status(503).json({ success: false, message: 'Game targets are unavailable.' });
    }
    const session = await prisma.gameSession.create({
      data: { targetStarIds: starsToFind.map((star) => star.id) },
    });
    const token = jwt.sign({
      kind: 'game', sessionId: session.id,
      startTime: session.startedAt.getTime(), starsToFind,
    }, process.env.PASSPORT_JS_SECRET, { expiresIn: '1h' });
    return res.status(201).json({ success: true, token });
  } catch (error) {
    return next(error);
  }
};

gameController.select = [
  body('starId').isInt().toInt(),
  async (req, res, next) => {
    if (!hasTokenKind(req, 'game')) return res.sendStatus(403);
    if (!validationResult(req).isEmpty()) {
      return res.status(400).json({ success: false, message: 'starId must be an integer.' });
    }
    try {
      const { starId } = matchedData(req);
      const session = await prisma.gameSession.findUnique({ where: { id: req.user.sessionId } });
      if (!session) return res.sendStatus(404);
      if (session.finishedAt) return res.sendStatus(409);
      if (!session.targetStarIds.includes(starId)) {
        return res.status(200).json({ success: true, found: false });
      }
      if (!session.foundStarIds.includes(starId)) {
        await prisma.gameSession.update({
          where: { id: session.id }, data: { foundStarIds: { push: starId } },
        });
      }
      return res.status(200).json({ success: true, found: true });
    } catch (error) {
      return next(error);
    }
  },
];

gameController.submit = async (req, res, next) => {
  if (!hasTokenKind(req, 'game')) return res.sendStatus(403);
  try {
    const session = await prisma.gameSession.findUnique({ where: { id: req.user.sessionId } });
    if (!session) return res.sendStatus(404);
    if (!session.targetStarIds.length ||
        !session.targetStarIds.every((id) => session.foundStarIds.includes(id))) {
      return res.status(409).json({ success: false, message: 'Find every target star first.' });
    }
    if (!session.finishedAt) {
      const now = new Date();
      await prisma.gameSession.updateMany({
        where: { id: session.id, finishedAt: null },
        data: { finishedAt: now, totalTimeMs: Math.max(0, now.getTime() - session.startedAt.getTime()) },
      });
    }
    const finished = await prisma.gameSession.findUnique({ where: { id: session.id } });
    const token = jwt.sign({
      kind: 'score', sessionId: session.id, totalTime: finished.totalTimeMs,
    }, process.env.PASSPORT_JS_SECRET, { expiresIn: '1d' });
    return res.status(201).json({ success: true, token });
  } catch (error) {
    return next(error);
  }
};

gameController.submitName = [
  submitValidator,
  async (req, res, next) => {
    if (!hasTokenKind(req, 'score')) return res.sendStatus(403);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const queryErrors = {};
      errors.array().forEach((error) => { queryErrors[error.path] = error.msg; });
      return res.status(400).json({ queryErrors, success: false });
    }
    try {
      const { name, latitude, longitude } = matchedData(req);
      const leaderboard = await prisma.$transaction(async (tx) => {
        const session = await tx.gameSession.findUnique({ where: { id: req.user.sessionId } });
        if (!session?.finishedAt || session.totalTimeMs == null) return null;
        const claimed = await tx.gameSession.updateMany({
          where: { id: session.id, savedAt: null, finishedAt: { not: null } },
          data: { savedAt: new Date() },
        });
        if (claimed.count !== 1) return null;
        return tx.leaderboard.create({
          data: {
            name, totalTimeMiliseconds: session.totalTimeMs,
            geoLat: latitude ?? null, geoLong: longitude ?? null,
          },
        });
      });
      if (!leaderboard) {
        return res.status(409).json({ success: false, message: 'Score is unavailable or already saved.' });
      }
      return res.status(201).json({ success: true, leaderboardId: leaderboard.id });
    } catch (error) {
      return next(error);
    }
  },
];

export default gameController;
