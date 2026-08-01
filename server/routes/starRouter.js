import { Router } from 'express';
import starController from '../controllers/starcontroller.js';

const starRouter = Router();

starRouter.get('/frame', starController.getFrame);
starRouter.get('/:id', starController.get);

export default starRouter;
