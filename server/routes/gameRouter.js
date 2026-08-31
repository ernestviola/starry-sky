import { Router } from 'express';
import gameController from '../controllers/gameController.js';
import { authJWT } from '../libs/passport.js';
import leaderboardRouter from './leaderboardRouter.js';

const gameRouter = Router();

gameRouter.post('/start', gameController.start);

gameRouter.post('/submit', authJWT, gameController.submit);
gameRouter.post('/submit/name', authJWT, gameController.submitName);

gameRouter.route('/leaderboard', leaderboardRouter);

export default gameRouter;
