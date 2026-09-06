import { Router } from 'express';
import leaderboardController from '../controllers/leaderboardController.js';

const leaderboardRouter = Router();

leaderboardRouter.get('/', (req, res) =>
  res.status(200).json({ success: true }),
);

leaderboardRouter.get('/global', leaderboardController.getGlobal);

leaderboardRouter.get('/local', leaderboardController.getLocal);

export default leaderboardRouter;
