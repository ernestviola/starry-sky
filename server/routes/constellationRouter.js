import { Router } from 'express';
import constellationController from '../controllers/constellationController.js';

const constellationRouter = Router();

constellationRouter.get('/search', constellationController.search);
constellationRouter.get('/lookup/:name', constellationController.getByName);
constellationRouter.get('/frame', constellationController.getFrame);

export default constellationRouter;
