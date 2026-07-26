import { Router } from 'express';
import eventRouter from './eventRouter';

const router = Router();
router.use('/events', eventRouter);

export default router;
