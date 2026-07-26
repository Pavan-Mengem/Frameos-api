import { Router } from 'express';
import leadRouter from './leadRouter';
import publicEnquiryRouter from './publicEnquiryRouter';

const router = Router();
router.use('/leads', leadRouter);
router.use('/', publicEnquiryRouter);

export default router;
