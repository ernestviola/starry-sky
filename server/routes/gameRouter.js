import { Router } from 'express';
import gameController from '../controllers/gameController.js';

const gameRouter = Router();

gameRouter.post('/start', gameController.start);

gameRouter.post('/submit', gameController.submit);

export default gameRouter;
