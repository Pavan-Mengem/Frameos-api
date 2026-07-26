import { Router } from 'express';
import quotationRouter from './quotationRouter';
import publicQuotationRouter from './publicQuotationRouter';

const router = Router();
router.use('/quotations', quotationRouter);
router.use('/', publicQuotationRouter);

export default router;
