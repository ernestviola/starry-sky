import { Router } from 'express';
import gameController from '../controllers/gameController.js';
import { authJWT } from '../libs/passport.js';

const gameRouter = Router();

gameRouter.post('/start', gameController.start);

gameRouter.post('/submit', authJWT, gameController.submit);

export default gameRouter;
