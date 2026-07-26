import { Router } from 'express';
import paymentRouter from './paymentRouter';
import webhookRouter from './webhookRouter';

const router = Router();
router.use('/payments', paymentRouter);
router.use('/', webhookRouter);

export default router;
