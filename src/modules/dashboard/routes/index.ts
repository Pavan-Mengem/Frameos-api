import { Router } from 'express';
import dashboardRouter from './dashboardRouter';

const router = Router();
router.use('/', dashboardRouter);

export default router;
