import { Router } from 'express';
import clientRouter from './clientRouter';

const router = Router();
router.use('/clients', clientRouter);

export default router;
