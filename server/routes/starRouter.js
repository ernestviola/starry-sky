import { Router } from 'express';
import starController from '../controllers/starController.js';

const starRouter = Router();

starRouter.get('/frame', starController.getFrame);

export default starRouter;
