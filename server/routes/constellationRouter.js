import { Router } from 'express';
import constellationController from '../controllers/constellationController.js';

const constellationRouter = Router();

constellationRouter.get('/frame', constellationController.getFrame);

export default constellationRouter;
