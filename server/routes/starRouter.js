import { Router } from 'express';
import starController from '../controllers/starController.js';

const starRouter = Router();

starRouter.get('/', starController.getAll);
starRouter.get('/frame', starController.getFrame);

export default starRouter;
