import { Router } from 'express';
import paymentRouter from './paymentRouter';
import webhookRouter from './webhookRouter';
import invoiceRouter from './invoiceRouter';

const router = Router();
router.use('/payments', paymentRouter);
router.use('/', webhookRouter);
router.use('/', invoiceRouter);

export default router;
