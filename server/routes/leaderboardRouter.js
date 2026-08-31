import { Router } from 'express';
import leaderboardController from '../controllers/leaderboardController.js';

const leaderboardRouter = Router();

leaderboardRouter.get('/global', leaderboardController.getGlobal);
leaderboardRouter.get('/local', leaderboardController.getLocal);

export default leaderboardRouter;
