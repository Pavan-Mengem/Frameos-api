import { Router } from 'express';
import clientRouter from './clientRouter';
import publicClientPortalRouter from './publicClientPortalRouter';

const router = Router();
router.use('/clients', clientRouter);
router.use('/', publicClientPortalRouter);

export default router;
